const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {
    log,
    write
} = require('firebase-functions/lib/logger');
admin.initializeApp();
const database = admin.database();

module.exports = {
    DB_KEY_USERS: "users",
    DB_KEY_USER_EXTRA_INFO: "user_extra_info",
    DB_KEY_POSTS: "posts",
    DB_KEY_COMMENTS: "comments",
    DB_KEY_FOLLOWING: "following",
    DB_KEY_FOLLOWERS: "followers",
    DB_KEY_USER_FEED_POSTS: "user_feed_posts",
    DB_KEY_CHATS: "chats",
    DB_KEY_MESSAGES: "messages",
    DB_KEY_LIKES: "likes",
    DB_KEY_USER_CHATS : "user_chats",
    DB_KEY_STORIES: "stories",
    DB_KEY_FEED_STORIES: "feed_stories",

    functions: functions,
    database: database,
    log: log,
    write: write
}