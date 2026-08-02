export const getPath = ( obj: any, path?: string ): any =>
{
    if( !obj ){ return undefined }

    if( path )
    {
        for( const key of path.split( '.' ))
        {
            if( obj === null || obj === undefined ){ return undefined }

            obj = obj[key];
        }
    }

    return obj;
};
