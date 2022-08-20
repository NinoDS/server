# The Backend handling the API including the lockers and accounts


## Routes
Every request should have `username` and `password` in the authorization header.

- **GET** `lockers/`:
    Returns all lockers
- **GET** `lockers/:id/`:
    Returns a specific locker with the given id
- **POST** `lockers/`:
    Creates a new locker
- **PUT** `lockers/:id/`:
    Updates a specific locker with the given id to the given values
- **DELETE** `lockers/:id/`:
    Deletes a specific locker with the given id
- `accounts/`:
    ⚠️ Not implemented yet