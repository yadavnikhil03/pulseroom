const usersArray = [];

const assignRoomHost = roomId => {
  const roomUsers = usersArray.filter(user => user.room === roomId);
  const currentHost = roomUsers.find(user => user.isHost);
  const hostId = currentHost?.id || roomUsers[0]?.id;

  roomUsers.forEach(user => {
    user.isHost = user.id === hostId;
  });
};

module.exports = {
  addUser: (roomId, user, socket) => {
    const currentUser = {
      ...user,
      room: roomId,
      socketId: socket.id,
      isHost: false
    };

    if (!usersArray.some(item => item.socketId === currentUser.socketId)) {
      usersArray.push(currentUser);
      assignRoomHost(roomId);
    }

    return currentUser;
  },

  getUsersInRoom: currentRoom =>
    usersArray.filter(user => user.room === currentRoom),

  removeUser: socket => {
    const index = usersArray.findIndex(user => user.socketId === socket.id);
    if (index === -1) return undefined;

    const removedUser = usersArray.splice(index, 1)[0];
    assignRoomHost(removedUser.room);
    return removedUser;
  },

  transferHost: (roomId, newHostSocketId) => {
    const roomUsers = usersArray.filter(user => user.room === roomId);
    roomUsers.forEach(user => {
      user.isHost = user.socketId === newHostSocketId;
    });
    return roomUsers.find(user => user.socketId === newHostSocketId) || null;
  },

  kickUser: (roomId, socketIdToKick) => {
    const index = usersArray.findIndex(
      user => user.room === roomId && user.socketId === socketIdToKick
    );
    if (index === -1) return undefined;
    const removedUser = usersArray.splice(index, 1)[0];
    assignRoomHost(roomId);
    return removedUser;
  }
};
