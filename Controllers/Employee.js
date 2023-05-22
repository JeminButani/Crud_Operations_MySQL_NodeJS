const db = require('../DB/Connection')

// Create Employee with multiple contact details
exports.createEmployee = (req, res) => {
  // Check if tables exist, create them if necessary
  createTablesIfNotExists(error => {
    if (error) {
      console.error('Error creating tables:', error)
      res
        .status(500)
        .json({ error: 'An error occurred while creating the tables' })
      return
    }

    // Extract employee details from the request body
    const {
      name,
      jobTitle,
      phoneNumber,
      email,
      address,
      city,
      state,
      emergencyContacts
    } = req.body

    //SQL query to insert the employee into the database
    const query =
      'INSERT INTO employees (name, job_title, phone_number, email, address, city, state) VALUES (?, ?, ?, ?, ?, ?, ?)'
    const values = [name, jobTitle, phoneNumber, email, address, city, state]

    // Execute the SQL query
    db.query(query, values, (error, result) => {
      if (error) {
        console.error('Error creating employee:', error)
        res
          .status(500)
          .json({ error: 'An error occurred while creating the employee' })
        return
      }

      // Retrieve the newly created employee's ID
      const employeeId = result.insertId
      if (emergencyContacts && emergencyContacts.length > 0) {
        // If there are emergency contacts provided, insert them into the database
        const contactQuery =
          'INSERT INTO employee_emergency_contacts (employee_id, name, phone_number, relationship) VALUES ?'
        const contactValues = emergencyContacts.map(contact => [
          employeeId,
          contact.name,
          contact.phoneNumber,
          contact.relationship
        ])

        // Execute the SQL query to insert emergency contacts
        db.query(contactQuery, [contactValues], contactError => {
          if (contactError) {
            console.error(
              'Error creating employee emergency contacts:',
              contactError
            )
            res.status(500).json({
              error:
                'An error occurred while creating the employee emergency contacts'
            })
            return
          }

          // Send a success response
          res.status(201).json({ message: 'Employee created successfully' })
        })
      } else {
        // If no emergency contacts are provided, send a success response
        res.status(201).json({ message: 'Employee created successfully' })
      }
    })
  })
}

// List Employees with pagination
exports.listEmployees = (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const offset = (page - 1) * limit

  // Query to retrieve the total count of employees
  const countQuery = 'SELECT COUNT(*) as total FROM employees'

  // Query to retrieve employees with their emergency contact details
  const listQuery =
    'SELECT e.id, e.name as employee_name, e.job_title, e.phone_number, e.email, e.address, e.city, e.state, c.name as contact_name, c.phone_number as contact_phone_number, c.relationship FROM employees e LEFT JOIN employee_emergency_contacts c ON e.id = c.employee_id LIMIT ? OFFSET ?'

  // Execute the count query to get the total count of employees.
  db.query(countQuery, (countError, countResult) => {
    if (countError) {
      console.error('Error retrieving employee count:', countError)
      res
        .status(500)
        .json({ error: 'An error occurred while retrieving employee count' })
      return
    }

    // Retrieve the total count of employees
    const total = countResult[0].total

    // Execute the query to retrieve employees with pagination
    db.query(listQuery, [limit, offset], (listError, listResult) => {
      if (listError) {
        console.error('Error retrieving employees:', listError)
        res
          .status(500)
          .json({ error: 'An error occurred while retrieving employees' })
        return
      }

      // Map the results to employees and their respective emergency contacts
      const employees = []
      const employeeMap = new Map()

      listResult.forEach(row => {
        const employeeId = row.id

        if (!employeeMap.has(employeeId)) {
          // Create a new employee with their details
          const employee = {
            id: row.id,
            name: row.employee_name,
            jobTitle: row.job_title,
            phoneNumber: row.phone_number,
            email: row.email,
            address: row.address,
            city: row.city,
            state: row.state,
            emergencyContacts: []
          }

          // Add the new employee to the list and map
          employees.push(employee)
          employeeMap.set(employeeId, employee)
        }

        // Check if the row has emergency contact details
        if (row.contact_name && row.contact_phone_number && row.relationship) {
          // Get the employee from the map and push the emergency contact details
          const employee = employeeMap.get(employeeId)
          employee.emergencyContacts.push({
            name: row.contact_name,
            phoneNumber: row.contact_phone_number,
            relationship: row.relationship
          })
        }
      })

      // Send the response with the list of employees and pagination details
      res.status(200).json({
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        employees
      })
    })
  })
}

// Update Employee
exports.updateEmployee = (req, res) => {
  const { id } = req.params
  const {
    name,
    jobTitle,
    phoneNumber,
    email,
    address,
    city,
    state,
    emergencyContacts
  } = req.body

  //SQL query to update the employee in the database
  const updateQuery =
    'UPDATE employees SET name = ?, job_title = ?, phone_number = ?, email = ?, address = ?, city = ?, state = ? WHERE id = ?'
  const updateValues = [
    name,
    jobTitle,
    phoneNumber,
    email,
    address,
    city,
    state,
    id
  ]

  db.query(updateQuery, updateValues, updateError => {
    if (updateError) {
      console.error('Error updating employee:', updateError)
      res
        .status(500)
        .json({ error: 'An error occurred while updating the employee' })
      return
    }

    if (emergencyContacts && emergencyContacts.length > 0) {
      // If there are emergency contacts provided, delete existing contacts and insert the updated ones
      const deleteQuery =
        'DELETE FROM employee_emergency_contacts WHERE employee_id = ?'
      const insertQuery =
        'INSERT INTO employee_emergency_contacts (employee_id, name, phone_number, relationship) VALUES ?'
      const insertValues = emergencyContacts.map(contact => [
        id,
        contact.name,
        contact.phoneNumber,
        contact.relationship
      ])

      // Delete existing emergency contacts for the employee
      db.query(deleteQuery, id, deleteError => {
        if (deleteError) {
          console.error(
            'Error deleting employee emergency contacts:',
            deleteError
          )
          res.status(500).json({
            error:
              'An error occurred while updating the employee emergency contacts'
          })
          return
        }

        // Insert the updated emergency contacts for the employee
        db.query(insertQuery, [insertValues], insertError => {
          if (insertError) {
            console.error(
              'Error creating employee emergency contacts:',
              insertError
            )
            res.status(500).json({
              error:
                'An error occurred while updating the employee emergency contacts'
            })
            return
          }

          res.status(200).json({ message: 'Employee updated successfully' })
        })
      })
    } else {
      // If no emergency contacts provided, simply respond with success message
      res.status(200).json({ message: 'Employee updated successfully' })
    }
  })
}

// Delete Employee
exports.deleteEmployee = (req, res) => {
  const { id } = req.params

  // SQL query to delete the employee from the database
  const deleteQuery = 'DELETE FROM employees WHERE id = ?'

  // Execute the SQL query to delete the employee
  db.query(deleteQuery, id, error => {
    if (error) {
      console.error('Error deleting employee:', error)
      res
        .status(500)
        .json({ error: 'An error occurred while deleting the employee' })
      return
    }

    res.status(200).json({ message: 'Employee deleted successfully' })
  })
}

// Get Employee by Id
exports.getEmployee = (req, res) => {
  const { id } = req.params

  // SQL query to retrieve the employee from the database
  const selectQuery = 'SELECT * FROM employees WHERE id = ?'

  // Execute the SQL query to retrieve the employee
  db.query(selectQuery, id, (error, result) => {
    if (error) {
      console.error('Error retrieving employee:', error)
      res
        .status(500)
        .json({ error: 'An error occurred while retrieving the employee' })
      return
    }

    if (result.length === 0) {
      // If no employee found with the given ID, respond with not found error
      res.status(404).json({ error: 'Employee not found' })
      return
    }

    const employee = result[0]

    // Retrieve the emergency contacts for the employee
    const contactQuery =
      'SELECT * FROM employee_emergency_contacts WHERE employee_id = ?'

    // Execute the SQL query to retrieve the emergency contacts
    db.query(contactQuery, id, (contactError, contactResult) => {
      if (contactError) {
        console.error(
          'Error retrieving employee emergency contacts:',
          contactError
        )
        res.status(500).json({
          error:
            'An error occurred while retrieving the employee emergency contacts'
        })
        return
      }

      const emergencyContacts = contactResult

      // Send the response with the employee and their emergency contacts
      res.status(200).json({
        employee,
        emergencyContacts
      })
    })
  })
}

// Helper function to create tables if not exists
function createTablesIfNotExists (callback) {
  const employeesTableQuery = `
    CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      job_title VARCHAR(255) NOT NULL,
      phone_number VARCHAR(15) NOT NULL,
      email VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      state VARCHAR(255) NOT NULL
    )
  `

  const emergencyContactsTableQuery = `
    CREATE TABLE IF NOT EXISTS employee_emergency_contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(15) NOT NULL,
      relationship VARCHAR(255) NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `

  db.query(employeesTableQuery, error => {
    if (error) {
      callback(error)
      return
    }

    db.query(emergencyContactsTableQuery, error => {
      if (error) {
        callback(error)
        return
      }

      callback(null)
    })
  })
}
