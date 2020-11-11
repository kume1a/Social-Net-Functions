const constants = require("./constants")

const triggers = require("./triggers");

exports.incrementsLikeCount = triggers.incrementsLikeCount;
exports.decrementsLikeCount = triggers.decrementsLikeCount;

exports.incrementsCommentCount = triggers.incrementsCommentCount;
exports.decrementsCommentCount = triggers.decrementsCommentCount;

exports.incrementsPostCountAndWritesPostIdToFollowers = triggers.incrementsPostCountAndWritesPostIdToFollowers;
exports.decrementsPostCount = triggers.decrementsPostCount;

exports.incrementsFollowingFollowerCount = triggers.incrementsFollowingFollowerCount;
exports.decrementsFollowingFollowerCount = triggers.decrementsFollowingFollowerCount;

exports.createsUserChat = triggers.createsUserChat;
exports.writesStoryToFollowers = triggers.writesStoryToFollowers;

exports.followUser = constants.functions.https.onCall(data => {
    const currentUid = data.currentUid;
    const targetUid = data.targetUid;

    let updates = {};
    updates[constants.DB_KEY_FOLLOWING + "/" + currentUid + "/" + targetUid] = true;
    updates[constants.DB_KEY_FOLLOWERS + "/" + targetUid + "/" + currentUid] = true;

    return constants.database
        .ref()
        .update(updates);
});


exports.unFollowUser = constants.functions.https.onCall(data => {
    const currentUid = data.currentUid;
    const targetUid = data.targetUid;

    let updates = {};
    updates[constants.DB_KEY_FOLLOWING + "/" + currentUid + "/" + targetUid] = null;
    updates[constants.DB_KEY_FOLLOWERS + "/" + targetUid + "/" + currentUid] = null;

    return constants.database
        .ref()
        .update(updates);
});


exports.createPost = constants.functions.https.onCall(async data => {
    const posterUid = data.posterUid;
    const timestamp = data.timestamp;
    const postImageUri = data.postImageUri;
    const likeCount = data.likeCount;
    const commentCount = data.commentCount;
    const header = data.header;
    const description = data.description;

    const postRefKey = (await constants.database.ref(constants.DB_KEY_POSTS).push()).key;

    await constants.database
        .ref(constants.DB_KEY_POSTS + "/" + postRefKey)
        .set({
            "postId": postRefKey,
            "posterUid": posterUid,
            "timestamp": timestamp,
            "postImageUri": postImageUri,
            "likeCount": likeCount,
            "commentCount": commentCount,
            "header": header,
            "description": description
        });
    return null;
});

exports.getFeedPost = constants.functions.https.onCall(async data => {
    const postId = data.postId;
    const currentUid = data.currentUid;

    const postSnapshot = await constants.database
        .ref(constants.DB_KEY_POSTS + "/" + postId)
        .once("value");

    const post = postSnapshot.val();
    const posterUid = post.posterUid;

    const userSnapshot = await constants.database
        .ref(constants.DB_KEY_USERS + "/" + posterUid)
        .once("value");

    const isLikedSnapshot = await constants.database
        .ref(constants.DB_KEY_LIKES + "/" + postId + "/" + currentUid)
        .once("value");

    const user = userSnapshot.val();
    const isLiked = isLikedSnapshot.exists();

    return {
        "postId": post.postId,
        "posterUid": posterUid,
        "posterUsername": user.username,
        "posterImageUri": user.imageUri,
        "liked": isLiked,
        "timestamp": post.timestamp,
        "postImageUri": post.postImageUri,
        "likeCount": post.likeCount,
        "commentCount": post.commentCount,
        "header": post.header,
        "description": post.description
    }
});

exports.likeOrDislikePost = constants.functions.https.onCall(async data => {
    const postId = data.postId;
    const currentUid = data.currentUid;

    let liked;
    await constants.database
        .ref(constants.DB_KEY_LIKES + "/" + postId + "/" + currentUid)
        .transaction(currentValue => {
            if (currentValue !== null) {
                liked = true;
                return null;
            }
            liked = false;
            return true;
        });

    return !liked;
});

exports.getFollowingUsers = constants.functions.https.onCall(async data => {
    const currentUid = data.currentUid;

    const ref = constants.database.ref(constants.DB_KEY_FOLLOWING + "/" + currentUid);
    const listOfUsersSnapshot = await ref.orderByKey().limitToLast(30).once("value");

    let users = [];
    const listOfUsers = listOfUsersSnapshot.val();

    if (listOfUsers) {
        const listOfKeys = shuffle(
            Object.keys(listOfUsers)
        ).slice(0, listOfUsers.length >= 10 ? 10 : listOfUsers.length);

        for (const key of listOfKeys) {
            const userSnapshot = await constants
                .database
                .ref(constants.DB_KEY_USERS + "/" + key)
                .once("value");

            users.push(userSnapshot.val());
        }
    }
    return users;
});

exports.sendMessage = constants.functions.https.onCall(async data => {
    const chatId = data.chatId;
    const senderId = data.senderId;
    const message = data.message;
    const timestamp = data.timestamp;

    const messageId = (await constants.database.ref(constants.DB_KEY_MESSAGES + "/" + chatId).push()).key;
    const updates = {};

    updates[constants.DB_KEY_MESSAGES + "/" + chatId + "/" + messageId] = {
        "id": messageId,
        "senderId": senderId,
        "message": message,
        "timestamp": timestamp,
        "liked": false
    };
    updates[constants.DB_KEY_CHATS + "/" + chatId] = {
        "id": chatId,
        "lastMessage": message,
        "lastUpdated": timestamp
    };
    await constants.database.ref().update(updates);

    return null;
});

function shuffle(array) {
    let currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}