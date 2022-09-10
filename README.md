# The Backend handling the API including the lockers and accounts


## Routes
*Every request should have `username` and `password` in the authorization header.*

#### **GET** `/lockers`
Returns all lockers
#### **GET** `/lockers/id`
Returns a specific locker with the given id
#### **POST** `/lockers`
Creates a new locker
#### **PUT** `/lockers/id`
Updates a specific locker with the given id to the given values
#### **DELETE** `/lockers/id`
Deletes a specific locker with the given id
#### **Get** `/users`
Returns all usernames.\
*Note: We may change this to return also the permissions*
#### **GET** `/users/username`
Returns a specific user with the given username excluding the password
#### **POST** `/users`
Creates a new user with the given username and password and the given permissions
#### **PUT** `/users/username`
Updates a specific user with the given username to the given values
*Note* Admins can update any user, normal users can only update their own username and password
#### **DELETE** `/users/username`
Deletes a specific user with the given username.\
*Note: Only admins can delete users*
#### **GET** `/requests`
Returns all requests
#### **GET** `/requests/id`
Returns a specific request with the given id
#### **POST** `/requests`
Creates a new request with the given values
#### **PUT** `/requests/id`
Updates a specific request with the given id to the given values
#### **DELETE** `/requests/id`
Deletes a specific request with the given id


⚠️ Non-exhaustive