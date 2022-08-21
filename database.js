import * as fsSync from 'fs';

const fs = fsSync.promises;

class Database {
	constructor(path, init={}) {
		this.path = path;
		this.init(init);
	}

	/**
	 * Initialize the database.
	 * @param {Object} [obj={}] Initial object.
	 * @returns {Database}
	 */
	init(obj={}) {
		if (!fsSync.existsSync(this.path)) {
			fsSync.writeFileSync(this.path, JSON.stringify(obj));
		}
		return this;
	}

	/**
	 * Gets a key
	 * @param {String} key Key
	 * @param {boolean} [options.raw=false] Makes it so that we return the raw string value. Default is false.
	 */
	async get(key, options= {raw: false}) {
		const data = await fs.readFile(this.path, 'utf8');
		const json = JSON.parse(data);
		if (options.raw) {
			return json[key];
		}
		return json[key] ? json[key] : null;
	}

	/**
	 * Sets a key
	 * @param {any} key Key
	 * @param {any} value Value
	 */
	async set(key, value) {
		const data = await fs.readFile(this.path, 'utf8');
		const json = JSON.parse(data);
		json[key] = value;
		await fs.writeFile(this.path, JSON.stringify(json));
	}

	/**
	 * Deletes a key
	 * @param {String} key Key
	 */
	async delete(key) {
		const data = await fs.readFile(this.path, 'utf8');
		const json = JSON.parse(data);
		delete json[key];
		await fs.writeFile(this.path, JSON.stringify(json));
	}

	/**
	 * List key starting with a prefix or list all.
	 * @param {String} prefix Filter keys starting with prefix.
	 */
	async list(prefix= "") {
		const data = await fs.readFile(this.path, 'utf8');
		const json = JSON.parse(data);
		if (prefix) {
			return Object.keys(json).filter(key => key.startsWith(prefix));
		}
		return Object.keys(json);
	}

	/**
	 * Clears the database.
	 */
	async empty() {
		await fs.writeFile(this.path, JSON.stringify({}));
	}

	/**
	 * Get all key/value pairs and return as an object
	 */
	async getAll() {
		const data = await fs.readFile(this.path, 'utf8');
		return JSON.parse(data);
	}

	/**
	 * Sets the entire database through an object.
	 * @param {Object} obj The object.
	 */
	async setAll(obj) {
		await fs.writeFile(this.path, JSON.stringify(obj));
	}

	/**
	 * Delete multiple entries by keys
	 * @param {Array<string>} args Keys
	 */
	async deleteMultiple(args) {
		const data = await fs.readFile(this.path, 'utf8');
		const json = JSON.parse(data);
		args.forEach(key => {
			delete json[key];
		});
		await fs.writeFile(this.path, JSON.stringify(json));
	}
}

export default Database;