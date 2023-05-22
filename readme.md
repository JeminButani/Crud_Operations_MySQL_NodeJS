# Employee Management API

This is a Node.js API for managing employees with CRUD (Create, Read, Update, Delete) operations using MySQL as the database.

## Features

- Create a new employee with multiple contact details (Relationship mapping)
- List employees with pagination
- Update an existing employee
- Delete an employee
- Get details of an employee

## Technologies Used

- Node.js
- Express.js
- MySQL

## Setup

1. Clone the repository:

    git clone <https://github.com/JeminButani/Crud_Operations_MySQL_NodeJS.git>

2. Install the dependencies:

    `npm install`

3. Configure the database connection:

   - Open the `Connection.js` file in the `./DB` directory.
   - Modify the `database` object with your MySQL database credentials `(host, user, password, database name)`.

4. Run the API server:

    `npm start`

    The server will start running on http://localhost:4000.

## API Endpoints

- `POST /employees`: Create a new employee with multiple contact details.
- `GET /employees`: List employees with pagination.
- `GET /employees/:id`: Get details of a specific employee.
- `PUT /employees/:id`: Update an existing employee.
- `DELETE /employees/:id`: Delete an employee.

## Database Schema

The database schema consists of the following tables:

- `employees`: Stores employee information such as `name, job title, phone number, email, address, city, and state`.
- `employee_emergency_contacts`: Stores emergency contact details of employees, linked by the `employee ID`.






