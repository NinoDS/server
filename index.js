import Database from "./database.js";
import express from "express";

const users = new Database("users.json");
const accounts = new Database("accounts.json");

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
 * Authentication middleware.
 */
app.use(async (req, res, next) => {
	const { username, password } = req.body;
	if (!username || !password) {
		return res.status(400).send("Missing username or password");
	}
	const user = await login(username, password);
	const path = req.path.substring(1).split("/");
	if (user.allowed.includes(path[0])) {
		next();
	} else {
		return res.status(403).send("Forbidden");
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
	const lockers = await accounts.getAll();
	for (let locker of lockers) {
		locker = filterLocker(locker, req.user);
	}
	res.send(lockers);
});

/**
 * Get locker by id.
 */
app.get("/lockers/:id", async (req, res) => {
	let locker = await accounts.get(req.params.id);
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
	const lockers = await accounts.getAll();
	let id = 0;
	for (const locker of lockers) {
		if (locker.id >= id) {
			id = locker.id + 1;
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
	await accounts.set(id, locker);
	res.send(locker);
});

/**
 * Update locker.
 */
app.put("/lockers/:id", async (req, res) => {
	const locker = req.body;
	await accounts.set(req.params.id, locker);
	res.send(locker);
});

/**
 * Delete locker.
 */
app.delete("/lockers/:id", async (req, res) => {
	await accounts.delete(req.params.id);
	res.send();
});

app.listen(port, () => console.log(`Server started on port ${port}`));