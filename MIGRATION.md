# Migration

This guide will help you through the neccesary steps to update your website to the latest version(v0.4.0) which also include adding authentication system to the api. As we have mentioned in the changelog that we have added the authentication system to url shortenting service.this change is for crucial for your data and will enable us to add more exiciting feature in the future.   

## What do you need to do?

- For now , we do not have direct login system. first you need to send your to client who will add the user data in the user table and as well as generate an API KEY and sent to you.

- Now you have API KEY, from now every time you send request to the url shortenting service ,you will need to add this API KEY as request header.

- You need to send as key value pair. 

```
Key  = "Authorization"
```
```
value  = api_key
```

- From now, you will do  CRUD operation with help this API KEY.

- You need to create again all your short code again.


## Why this change was neccesary?

we understand some of you think this doing thisa again as an inconvenience however this move also provides several key benfeits.

- Enhanced security for your data which means from now Only you can access your data and delete your data.
- it will help us to create more personalize user feature.

## Any Issues?

- if you are facing even after doing this, please reach out to us directily via email(example@gmail.com). 

We apperciate your understanding and cooperation to make urlshortening sevice make secure and reliable. your feadback is valuable for use.

Happing Hacking!!

The URL Shortenting Team