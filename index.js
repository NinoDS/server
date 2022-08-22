import Database from "./database.js";
import express from "express";
import cors from "cors";

const users = new Database("users.json");
const lockers = new Database("lockers.json", []);
const requests = new Database("requests.json", []);
const auditLog = new Database("auditlog.json", []);

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

/**
 * Logs an action.
 * @param {String} action Action
 * @param {String} username Username
 * @param {String} path Path
 * @param {String} [description] Description
 * @returns {Promise<void>}
 */
async function logAction(action, username, path, description) {
	const log = {
		timestamp: new Date().toISOString(),
		action,
		username,
		path,
		description
	};
	let auditLogData = await auditLog.getAll();
	auditLogData.push(log);
	await auditLog.setAll(auditLogData);
	console.log(formatLog(log));
}

function formatLog(log) {
	return `[${log.timestamp}] ${log.username}: ${log.action} ${log.path} ${log.description ? `(${log.description})` : ""}`;
}

/**
 * Login user and return it.
 * @param {String} username Username
 * @param {String} password Password
 * @returns {Promise<Object>} Account
 */
async function login(username, password) {
	const user = await users.get(username);
	if (!user) {
		throw new Error("User not found");
	}
	if (user.password !== password) {
		throw new Error("Invalid password");
	}
	return user;
}

/**
 * Authorization middleware.
 */
app.use(async (req, res, next) => {
	try {
		const auth = JSON.parse(req.headers.authorization);
		if (!auth?.password || !auth?.username) {
			return res.status(401).send("Unauthorized");
		}
		const {username, password} = auth;
		let user;
		try {
			user = await login(username, password);
		} catch (e) {
			return res.status(401).send("Unauthorized");
		}
		const path = req.path.substring(1).split("/");
		if (user?.permissions.paths === "*" || user?.permissions.paths.includes(path[0])) {
			req.user = user;
			next();
		} else {
			return res.status(403).send("Forbidden");
		}
	} catch (e) {
		return res.status(401).send(e.message);
	}
});

/**
 * Logger middleware.
 */
app.use(async (req, res, next) => {
	await logAction(req.method, req.user.username, req.path, req.body?.description);
	next();
});

/**
 * Filter out sepa data if not allowed.
 * @param {Object} locker Locker
 * @param {Object} user User
 * @returns {Object} Filtered locker
 */
function filterLocker(locker, user) {
	if (!user.permissions.sepa) {
		delete locker.sepa;
	}
	return locker;
}

/**
 * Get all lockers.
 */
app.get("/lockers", async (req, res) => {
	const lockersData = await lockers.getAll();
	for (let locker of lockersData) {
		locker = filterLocker(locker, req.user);
	}
	res.send(lockersData);
});

/**
 * Get locker by id.
 */
app.get("/lockers/:id", async (req, res) => {
	let locker = await lockers.get(req.params.id);
	if (!locker) {
		return res.status(404).send("Locker not found");
	}
	locker = filterLocker(locker, req.user);
	res.send(locker);
});

/**
 * Get new locker id.
 * @returns {Promise<number>} New locker id
 */
async function getNewLockerId() {
	const lockersData = await lockers.getAll();
	let id = 0;
	for (let locker of lockersData) {
		if (locker?.id ?? 0 >= id) {
			id = locker?.id ?? 0 + 1;
		}
	}
	return id;
}

/**
 * Create locker.
 */
app.post("/lockers", async (req, res) => {
	const locker = req.body;
	const id = await getNewLockerId();
	locker.id = id;
	await lockers.set(id, locker);
	res.send(locker);
});

/**
 * Update locker.
 */
app.put("/lockers/:id", async (req, res) => {
	const locker = req.body;
	await lockers.set(req.params.id, locker);
	res.send(locker);
});

/**
 * Delete locker.
 */
app.delete("/lockers/:id", async (req, res) => {
	await lockers.delete(req.params.id);
	res.send();
});

/**
 * Get all usernames.
 */
app.get("/users", async (req, res) => {
	const usersData = await users.list();
	res.send(usersData);
});

/**
 * Get user by username.
 */
app.get("/users/:username", async (req, res) => {
	const user = await users.get(req.params.username);
	if (!user) {
		return res.status(404).send("User not found");
	}
	delete user.password;
	res.send(user);
});

/**
 * Create user.
 */
app.post("/users", async (req, res) => {
	// Only admins can create users.
	if (!req.user.permissions.admin) {
		return res.status(403).send("Forbidden");
	}
	const user = req.body;
	await users.set(user.username, user);
	res.send(user);
});

/**
 * Update user.
 */
app.put("/users/:username", async (req, res) => {
	// Admin can update any user. User can update his username and password.
	if (req.user.permissions.admin) {
		await users.set(req.params.username, req.body);
		return res.send(await users.get(req.params.username));
	}
	if (req.user.username === req.params.username) {
		if (req.body.password) {
			await users.set(req.params.username, {...await users.get(req.params.username), password: req.body.password});
		}
		if (req.body.username) {
			await users.set(req.body.username, await users.get(req.params.username));
			await users.delete(req.params.username);
		}
		return res.send(await users.get(req.params.username));
	}
	return res.status(403).send("Forbidden");
});

/**
 * Delete user.
 */
app.delete("/users/:username", async (req, res) => {
	// Only admins can delete users.
	if (!req.user.permissions.admin) {
		return res.status(403).send("Forbidden");
	}
	await users.delete(req.params.username);
	res.send();
});

/**
 * Change user password.
 */
app.put("/users/:username/change-password", async (req, res) => {
	// Only admins or user himself can change password.
	if (!req.user.permissions.admin && req.user.username !== req.params.username) {
		return res.status(403).send("Forbidden");
	}
	if (req.body.password) {
		await users.set(req.params.username, {...await users.get(req.params.username), password: req.body.password});
	} else {
		return res.status(400).send("Password is required");
	}
	res.send();
});

/**
 * Get all locker requests.
 */
app.get("/requests", async (req, res) => {
	const requestsData = await requests.getAll();
	res.send(requestsData);
});

/**
 * Get locker request by id.
 */
app.get("/requests/:id", async (req, res) => {
	const request = await requests.get(req.params.id);
	if (!request) {
		return res.status(404).send("Request not found");
	}
	res.send(request);
});

/**
 * Create locker request.
 */
app.post("/requests", async (req, res) => {
	const request = req.body;
	await requests.set(request.id, request);
	res.send(request);
});

/**
 * Update locker request.
 */
app.put("/requests/:id", async (req, res) => {
	const request = req.body;
	await requests.set(req.params.id, request);
	res.send(request);
});

/**
 * Delete locker request.
 */
app.delete("/requests/:id", async (req, res) => {
	await requests.delete(req.params.id);
	res.send();
});

app.get("/key", (req, res) => {
        res.send(Math.random() <= 0.5 ? "GURKE" : "SECRET");
});

app.listen(port, () => console.log(`Server started on port ${port}`));
