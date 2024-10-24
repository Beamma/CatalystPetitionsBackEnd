# Catalyst Petitions API Server

The server is created using expressJS meaning node.js will be required. 

## Running locally

1. Use `npm install` to populate the `node_modules/` directory with up-to-date packages
2. Create a file called `.env`, following the instructions in the section below
3. Go to `.env` and supply required database information (See below)
2. Run `npm run start` or `npm run debug` to start the server
3. The server will be accessible on `localhost:4941`

### `.env` file

Create a `.env` file in the root directory of this project including the following information (note that you will need
to create the database first in phpMyAdmin):

```
MYSQL_HOST=
MYSQL_USER={your username}
MYSQL_PASSWORD={your password}
MYSQL_DATABASE={a database}
```

## Some notes about endpoint status codes

The api spec provides several status codes that each endpoint can return. Apart from the 500 'Internal Server Error'
each of these represents a flow that may be tested. A brief overview is provided in the table below.

| Status Code | Status Message        | Description                                                                   | Example                                          |
|:------------|-----------------------|-------------------------------------------------------------------------------|--------------------------------------------------|
| 200         | OK                    | Request completed successfully                                                | Successfully get petitions                       |
| 201         | Created               | Resources created successfully                                                | Successfully create a petition                   |
| 400         | Bad Request           | The request failed due to client error                                        | Creating a petition without a request body       |
| 401         | Unauthorised          | The requested failed due invalid authorisation                                | Creating a petition without authorisation header |
| 403         | Forbidden             | The request is refused by the server                                          | Trying to delete someone else's petition         |
| 500         | Internal Server Error | The request causes an error and cannot be completed                           |                                                  |
| 501         | Not Implemented       | The request can not be completed because the functionality is not implemented |                                                  | 
