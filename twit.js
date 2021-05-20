const Twit = require("twit");

const twitConfig = (req) => {
    return new Twit({
        consumer_key:         process.env.TWITTER_CONSUMER_KEY,
        consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
        access_token:         req.user.token,
        access_token_secret:  req.user.tokenSecret,
      });
};

exports.twitConfig = twitConfig;