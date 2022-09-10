/**
 * Verify locker object.
 * @param {Object} locker Locker object
 * @returns {boolean} True if locker is valid
 */
function validateLocker(locker) {
    /* Locker schema:
    {
        id: number!,
        user: User!,
        renter: Renter!,
        expirationDate: Date as string!,
        broken: boolean,
        note: string
        sepa: Sepa?
    }
     */

    if (!locker.id || typeof locker.id !== 'number') {
        return false;
    }

    if (!locker.user || !validateUser(locker.user)) {
        return false;
    }

    if (!locker.renter || !validateRenter(locker.renter)) {
        return false;
    }

    if (!locker.expirationDate || typeof locker.expirationDate !== 'string' || !validateDate(locker.expirationDate)) {
        return false;
    }

    if (typeof locker.broken !== 'boolean') {
        return false;
    }

    if (typeof locker.note !== 'string') {
        return false;
    }

    if (locker.sepa && !validateSepa(locker.sepa)) {
        return false;
    }

    return true;
}

function validateDate(date) {
    return isFinite(Date.parse(date));
}

function validateUser(user) {
    /* User schema:
    {
        id: number!,
        firstName: string,
        lastName: string,
        class: string,
        phone: string,
        mobile: string,
        email: string,
     */

    if (!user.id || typeof user.id !== 'number') {
        return false;
    }

    if (typeof user.firstName !== 'string') {
        return false;
    }

    if (typeof user.lastName !== 'string') {
        return false;
    }

    if (typeof user.class !== 'string') {
        return false;
    }

    if (typeof user.phone !== 'string') {
        return false;
    }

    if (typeof user.mobile !== 'string') {
        return false;
    }

    if (typeof user.email !== 'string') {
        return false;
    }

    return true;
}

function validateRenter(renter) {
    /* Renter schema:
    {
        id: number!,
        firstName: string,
        lastName: string,
        phone: string,
        mobile: string,
        email: string,
     */

    if (!renter.id || typeof renter.id !== 'number') {
        return false;
    }

    if (typeof renter.firstName !== 'string') {
        return false;
    }

    if (typeof renter.lastName !== 'string') {
        return false;
    }

    if (typeof renter.phone !== 'string') {
        return false;
    }

    if (typeof renter.mobile !== 'string') {
        return false;
    }

    if (typeof renter.email !== 'string') {
        return false;
    }

    return true;
}

function validateSepa(sepa) {
    /* Sepa schema:
    {
        child: string!,
        name: string!,
        bank: string!,
        iban: string!,
        bic: string!,
        appliesFrom: Date as string!,
     */

    if (typeof sepa.child !== 'string') {
        return false;
    }

    if (typeof sepa.name !== 'string') {
        return false;
    }

    if (typeof sepa.bank !== 'string') {
        return false;
    }

    if (typeof sepa.iban !== 'string') {
        return false;
    }

    if (typeof sepa.bic !== 'string') {
        return false;
    }

    if (!sepa.appliesFrom || typeof sepa.appliesFrom !== 'string' || !validateDate(sepa.appliesFrom)) {
        return false;
    }

    return true;
}

export { validateLocker, validateDate, validateRenter, validateUser, validateSepa };