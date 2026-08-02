const fs = require('fs');

const getPath = ( obj, path ) =>
{
    if( path )
    {
        for( let key of path.split(/\./g) )
        {
            if(( obj = obj[key] ) === undefined ){ break; }
        }
    }

	return obj;
}

const resolveVariables = ( str, scopes, transformation ) =>
{
	let missing = new Set(), resolved = new Set(), value = str.replace(/\{([^%]+)(%([^}]+)){0,1}\}/g, ( match, path, _, modifiers ) =>
	{
		let value;

		for( let scope of scopes )
		{
			if(( value = getPath( scope, path )) !== undefined )
			{
				resolved.add( path );

				return transformation ? transformation( value, modifiers ) : value;
			}
		}

		missing.add( path );

		return path;
	});

	return { missing: missing.size, resolved: resolved.size, value };
}

const Dictionaries = new Map();

module.exports = class I18N
{
	constructor( options )
	{
		let dictionaries = options.dictionaries || options.dictionary;

		if( !Array.isArray( dictionaries )){ dictionaries = [ dictionaries ] };

		this.dictionaries = dictionaries.map( dictionary =>
		{
			if( typeof dictionary !== 'object' )
			{
				if( dictionary.startsWith('.') )
				{
					dictionary = require('path').resolve( require('path').dirname( new Error().stack.split(/\s*\n\s*/)[4].match(/\(([^():]+)[:0-9]*\)$/)[1] ), dictionary );
				}
				else
				{
					dictionary = require('path').resolve( dictionary );
				}
			}

			if( !Dictionaries.has( dictionary ))
			{
				Dictionaries.set( dictionary, typeof dictionary === 'string' ? require( dictionary ) : dictionary );
			}

			return dictionary;
		});

		this.locale = options.locale;
		this.transformation = options.transformation;
		this.variableTransformation = options.variableTransformation;
	}

	get( locale, ...args )
	{
		const { keys, scopes } = args.reduce(( args, arg ) =>
		{
			switch( typeof arg )
			{
				case 'string' 	: args.keys.push( arg ); break;
				case 'object' 	: args.scopes.push( arg ); break;
			}

			return args;
		},
		{ keys: [], scopes: [] });

		for( let key of keys )
		{
			for( let dictionary of this.dictionaries )
			{
				let locales = getPath( Dictionaries.get( dictionary ), key );

				if( locales !== undefined )
				{
					let localization = locales[locale] || ( this.locale && locales[this.locale] );

					if( localization )
					{
						if( Array.isArray( localization ))
						{
							let best_localization = { missing: Infinity };

							for( let i = 0; i < localization.length; ++i )
							{
								let resolved_localization = resolveVariables( localization[i], scopes, this.variableTransformation );

								if( resolved_localization.missing < best_localization.missing || resolved_localization.resolved > best_localization.resolved )
								{
									best_localization = resolved_localization;
								}
							}

							localization = best_localization.value;
						}
						else
						{
							localization = resolveVariables( localization, scopes, this.variableTransformation ).value;
						}

						return this.transformation ? this.transformation( localization ) : localization;
					}
					else{ return keys[0]; }
				}
			}
		}

		return keys[0];
    }
    
    dictionary( locale, path = '' )
    {
        let locale_dictionary = {};

        for( let dictionary of this.dictionaries )
        {
            let root = getPath( Dictionaries.get( dictionary ), path );

            if( root )
            {
                for( let key in root )
                {
                    if( root[key].hasOwnProperty( locale ) && (( typeof root[key][locale] === 'string' ) || ( Array.isArray( root[key][locale] ))))
                    {
                        if( typeof root[key][locale] === 'string' )
                        {
                            locale_dictionary[key] = root[key][locale];
                        }
                        else
                        {
                            locale_dictionary[key] = root[key][locale][root[key][locale].length - 1];
                        }
                    }
                    else
                    {
                        locale_dictionary[key] = this.dictionary( locale, ( path ? path + '.' : '' ) + key );
                    }
                }
            }
        }

        return locale_dictionary;
    }
}
