import seedUsers from "../test_data/users.json";

const USERS_KEY = "gymster_test_data_users";
const CURRENT_USER_KEY = "gymster_current_user";

const ROLE_HOME = {
  admin: "/admin",
  staff: "/staff",
  pt: "/pt",
  member: "/",
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getUsers() {
  if (!canUseStorage()) {
    return seedUsers;
  }

  const storedUsers = window.localStorage.getItem(USERS_KEY);
  if (storedUsers) {
    const parsedUsers = JSON.parse(storedUsers);
    const mergedUsers = [
      ...parsedUsers,
      ...seedUsers.filter((seedUser) => {
        return !parsedUsers.some((user) => user.username === seedUser.username || user.email === seedUser.email);
      }),
    ];

    if (mergedUsers.length !== parsedUsers.length) {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(mergedUsers));
    }

    return mergedUsers;
  }

  window.localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
  return seedUsers;
}

export function saveUsers(users) {
  if (canUseStorage()) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

export function loginUser(identifier, password) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const user = getUsers().find((item) => {
    return (
      item.username.toLowerCase() === normalizedIdentifier ||
      item.email.toLowerCase() === normalizedIdentifier
    );
  });

  if (!user || user.password !== password) {
    return { ok: false, message: "Tên đăng nhập/email hoặc mật khẩu không đúng." };
  }

  const { password: _password, ...safeUser } = user;
  if (canUseStorage()) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
  }

  return { ok: true, user: safeUser };
}

export function getCurrentUser() {
  if (!canUseStorage()) {
    return null;
  }

  const storedUser = window.localStorage.getItem(CURRENT_USER_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
}

export function getRoleHome(role) {
  return ROLE_HOME[role] || "/";
}

export function logoutUser() {
  if (canUseStorage()) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function registerUser(payload) {
  const users = getUsers();
  const normalizedUsername = payload.username.trim().toLowerCase();
  const normalizedEmail = payload.email.trim().toLowerCase();

  const duplicated = users.find((user) => {
    return (
      user.username.toLowerCase() === normalizedUsername ||
      user.email.toLowerCase() === normalizedEmail
    );
  });

  if (duplicated) {
    return { ok: false, message: "Tên đăng nhập hoặc email đã tồn tại." };
  }

  const nextUser = {
    id: Date.now(),
    role: "member",
    ...payload,
    username: payload.username.trim(),
    email: normalizedEmail,
  };

  saveUsers([...users, nextUser]);
  return { ok: true, user: nextUser };
}
