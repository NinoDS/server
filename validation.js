/**
 * Verify locker object.
 * @param {Object} locker Locker object
 * @returns {boolean} True if locker is valid
 */
function validateLocker(locker) {
    /* Locker schema:
    {
        id: number,
        renter: Renter,
        user: User,
        expiration: Date as string,
        defect: boolean,
        note: string,
    }
    */
    if (!locker.id || typeof locker.id !== "number") {
        return false;
    }
    if (!locker.renter || !validateRenter(locker.renter)) {
        return false;
    }
    if (!locker.user || !validateUser(locker.user)) {
        return false;
    }
    if (!locker.expiration || typeof locker.expiration !== "string") {
        return false;
    } else {
        const date = new Date(locker.expiration);
        if (isNaN(date.getTime())) {
            return false;
        }
    }
    if (typeof locker.defect !== "boolean") {
        return false;
    }
    if (typeof locker.note !== "string") {
        return false;
    }
    return true;
}

/**
 * Verify user object.
 * @param {Object} user User object
 * @returns {boolean} True if user is valid
 */
function validateUser(user) {
    /* User schema:
    {
        firstName: string,
        lastName: string,
        class: string,
        telephone: string,
        mobile: string,
        email: string,
     */
    if (!user.firstName || typeof user.firstName !== "string") {
        return false;
    }
    if (!user.lastName || typeof user.lastName !== "string") {
        return false;
    }
    if (!user.class || typeof user.class !== "string") {
        return false;
    }
    if (!user.telephone || typeof user.telephone !== "string") {
        return false;
    }
    if (!user.mobile || typeof user.mobile !== "string") {
        return false;
    }
    if (!user.email || typeof user.email !== "string") {
        return false;
    }
    return true;
}

/**
 * Verify renter object.
 * @param {Object} renter Renter object
 * @returns {boolean} True if renter is valid
 */
function validateRenter(renter) {
    /* Renter schema:
    {
        firstName: string,
        lastName: string,
        telephone: string,
        mobile: string,
        email: string,
    }
    */
    if (!renter.firstName || typeof renter.firstName !== "string") {
        return false;
    }
    if (!renter.lastName || typeof renter.lastName !== "string") {
        return false;
    }
    if (!renter.telephone || typeof renter.telephone !== "string") {
        return false;
    }
    if (!renter.mobile || typeof renter.mobile !== "string") {
        return false;
    }
    if (!renter.email || typeof renter.email !== "string") {
        return false;
    }
    return true;
}

export { validateLocker, validateUser, validateRenter };