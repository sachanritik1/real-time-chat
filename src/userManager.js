"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
var UserManager = /** @class */ (function () {
    function UserManager() {
        this.map = new Map();
    }
    UserManager.prototype.addUser = function (name, roomId, userId, socket) {
        var room = this.map.get(roomId);
        var user = {
            id: userId,
            name: name,
            conn: socket,
        };
        if (!room) {
            this.map.set(roomId, {
                users: [user],
            });
        }
        else {
            room.users.push(user);
        }
    };
    UserManager.prototype.removeUser = function (roomId, userId) {
        var _a;
        var userToRemove = this.getUser(roomId, userId);
        if (!userToRemove)
            return;
        var remainingUsers = (_a = this.map
            .get(roomId)) === null || _a === void 0 ? void 0 : _a.users.filter(function (user) { return user.id == userId; });
        if (!remainingUsers)
            remainingUsers = [];
        var room = {
            users: remainingUsers,
        };
        this.map.set(roomId, room);
    };
    UserManager.prototype.getUser = function (roomId, userId) {
        var room = this.map.get(roomId);
        if (!room)
            return;
        return room.users.find(function (user) { return user.id == userId; });
    };
    UserManager.prototype.broadcast = function (roomId, userId, message) {
        var user = this.getUser(roomId, userId);
        if (!user) {
            console.error("User not found");
            return;
        }
        var room = this.map.get(roomId);
        if (!room) {
            console.error("Rom rom not found");
            return;
        }
        room.users.forEach(function (_a) {
            var conn = _a.conn, id = _a.id;
            if (id === userId) {
                return;
            }
            console.log("outgoing message " + JSON.stringify(message));
            conn.sendUTF(JSON.stringify(message));
        });
    };
    return UserManager;
}());
exports.UserManager = UserManager;
