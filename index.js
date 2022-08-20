import Database from "./database.js";
import express from "express";

const users = await new Database("users.json").init();
const lockers = await new Database("lockers.json").init([]);

const app = express();
const port = 3000;

app.use(express.json());

/**
 * Login user and return it.
 * @param {String} username Username
 * @param {String} password Password
 * @returns {Promise<Object>} Account
 */
async function login(username, password) {
	console.log(username, password);
	console.log(users.getAll());
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
		const user = await login(username, password);
		const path = req.path.substring(1).split("/");
		if (user?.allowed === "*" || user?.allowed?.includes(path[0])) {
			next();
		} else {
			return res.status(403).send("Forbidden");
		}
	} catch (e) {
		return res.status(401).send(e.message);
	}
});

/**
 * Filter out sepa data if not allowed.
 * @param {Object} locker Locker
 * @param {Object} user User
 * @returns {Object} Filtered locker
 */
function filterLocker(locker, user) {
	if (!user.sepa) {
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
	const ids = lockersData.map(locker => locker.id);
	return Math.max(...ids) + 1;
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

app.listen(port, () => console.log(`Server started on port ${port}`));