const constants = require("./constants")


exports.incrementsLikeCount = constants.functions.database.ref("likes/{postId}/{likerId}")
    .onCreate((_snapshot, context) => {
        const postId = context.params.postId;

        return constants.database
            .ref(constants.DB_KEY_POSTS + "/" + postId + "/likeCount")
            .transaction(currentValue => {
                return ++currentValue
            });
    });

exports.decrementsLikeCount = constants.functions.database.ref("likes/{postId}/{likerId}")
    .onDelete((_snapshot, context) => {
        const postId = context.params.postId;

        return constants.database
            .ref(constants.DB_KEY_POSTS + "/" + postId + "/likeCount")
            .transaction(currentValue => {
                return --currentValue
            });
    });

exports.incrementsCommentCount = constants.functions.database
    .ref("comments/{postId}/{commentAuthorId}")
    .onCreate((_snapshot, context) => {
        const postId = context.params.postId;

        return constants.database
            .ref(constants.DB_KEY_POSTS + "/" + postId + "/commentCount")
            .transaction(currentValue => {
                return ++currentValue
            });
    });

exports.decrementsCommentCount = constants.functions.database
    .ref("comments/{postId}/{commentAuthorId}")
    .onDelete((_snapshot, context) => {
        const postId = context.params.postId;

        return constants.database
            .ref(constants.DB_KEY_POSTS + "/" + postId + "/commentCount")
            .transaction(currentValue => {
                return --currentValue
            });
    });


exports.incrementsPostCountAndWritesPostIdToFollowers = constants.functions.database.ref("posts/{postId}")
    .onCreate(async (snapshot, _context) => {
        const data = snapshot.val();

        const posterId = data.posterUid;
        const postId = data.postId;

        // get followers of user who posted image
        const followers = await constants.database
            .ref(constants.DB_KEY_FOLLOWERS + "/" + posterId)
            .once("value");

        // write postId to followers 
        const feedPostsRef = constants.database.ref(constants.DB_KEY_USER_FEED_POSTS);
        followers
            .forEach(followerSnapshot => {
                feedPostsRef
                    .child(followerSnapshot.key)
                    .push()
                    .set(postId);
            });

        return constants.database.ref(constants.DB_KEY_USER_EXTRA_INFO + "/" + posterId + "/postCount")
            .transaction(currentValue => {
                return ++currentValue
            });
    });

exports.decrementsPostCount = constants.functions.database.ref("posts/{postId}")
    .onDelete((snapshot, _context) => {
        const posterId = snapshot.val().posterUid;

        return constants.database
            .ref(constants.DB_KEY_USER_EXTRA_INFO + "/" + posterId + "/postCount")
            .transaction(currentValue => {
                return --currentValue
            });
    });

exports.incrementsFollowingFollowerCount = constants.functions.database
    .ref("following/{targetId}/{followingId}")
    .onCreate((_snapshot, context) => {
        const followingUserId = context.params.followingId;
        const targetUserId = context.params.targetId;

        return constants.database
            .ref(constants.DB_KEY_USER_EXTRA_INFO + "/" + followingUserId + "/followerCount")
            .transaction(currentValue => {
                return ++currentValue
            }).then(() => {
                return constants.database
                    .ref(constants.DB_KEY_USER_EXTRA_INFO + "/" + targetUserId + "/followingCount")
                    .transaction(currentValue => {
                        return ++currentValue;
                    });
            });
    });

exports.decrementsFollowingFollowerCount = constants.functions.database
    .ref("following/{targetId}/{followingId}")
    .onDelete((_snapshot, context) => {
        const followingUserId = context.params.followingId;
        const targetUserId = context.params.targetId;

        return constants.database
            .ref(constants.DB_KEY_USER_EXTRA_INFO + "/" + followingUserId + "/followerCount")
            .transaction(currentValue => {
                return --currentValue
            }).then(() => {
                return constants.database
                    .ref(constants.DB_KEY_USER_EXTRA_INFO + "/" + targetUserId + "/followingCount")
                    .transaction(currentValue => {
                        return --currentValue;
                    });
            });
    });

exports.createsUserChat = constants.functions.database
    .ref("chats/{chatId}")
    .onCreate((_snapshot, context) => {
        const chatId = context.params.chatId;

        const id1 = chatId.split("_")[0];
        const id2 = chatId.split("_")[1];

        const updates = {};
        updates[constants.DB_KEY_USER_CHATS + "/" + id1 + "/" + chatId] = {
            "chatId": chatId,
            "unseenMessageCount": 0,
            "targetId": id2
        };
        updates[constants.DB_KEY_USER_CHATS + "/" + id2 + "/" + chatId] = {
            "chatId": chatId,
            "unseenMessageCount": 0,
            "targetId": id1
        };

        return constants.database.ref().update(updates);
    });

exports.writesStoryToFollowers = constants.functions.database
    .ref("stories/{posterId}/{storyId}")
    .onCreate(async (snapshot, context) => {
        const data = snapshot.val();

        const posterId = context.params.posterId;
        const storyId = context.params.storyId;

        // get followers of user who posted image
        const followers = await constants.database
            .ref(constants.DB_KEY_FOLLOWERS + "/" + posterId)
            .once("value");

        // write postId to followers 
        const feedStoriesRef = constants.database.ref(constants.DB_KEY_FEED_STORIES);
        followers.forEach(followerSnapshot => {
            feedStoriesRef
                .child(followerSnapshot.key)
                .child(posterId)
                .child(storyId)
                .set({
                    "storyId": storyId,
                    "timestamp": data.timestamp,
                    "imageUri": data.imageUri,
                });
        });
    });