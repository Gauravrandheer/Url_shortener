function isExpiredfunc(cachedData) {
  const isExpired = cachedData?.expired_at
    ? new Date() > new Date(cachedData.expired_at)
    : false;

  return isExpired;
}

function getCached(client,short_code){
    return client.get(short_code)
}

function updateCached(client,short_code,url_shortener_data){

    return client.set(
        short_code,
        JSON.stringify({
          original_url: url_shortener_data.original_url,
          passwordProtected: !!url_shortener_data.password,
          password: url_shortener_data.password || null,
          expired_at: url_shortener_data.expired_at || null,
        })
      );
}



module.exports = {
    isExpiredfunc,
    getCached,
    updateCached
}
