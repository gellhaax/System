const multer = require("multer");
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const firestore = require('./firebase');
const { FieldValue } = require('firebase-admin/firestore');
const { query: mysqlQuery, getTransaction } = require('./mysql_db');

const app = express();

// ===================== MIDDLEWARE =====================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ===================== AUTO CREATE UPLOADS FOLDER =====================
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ===================== MULTER CONFIG =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ===================== HELPER FUNCTIONS FOR FIRESTORE =====================
const getUsersCollection = () => firestore.collection('users');
const getStudentsCollection = () => firestore.collection('students');
const getTransactionsCollection = () => firestore.collection('transactions');
const getApprovalRequestsCollection = () => firestore.collection('approval_requests');
const getNotificationsCollection = () => firestore.collection('notifications');

// ===================== TEST =====================
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// ===================== AUTH =====================
app.post("/api/register", async (req, res) => {
  try {
    const body = req.body || {};
    const {
      first_name, last_name, email, contact, address,
      dob, age, gender, username, password, role
    } = body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    // ✅ FIX: Check username in-memory instead of chaining .where()
    const usersSnapshot = await getUsersCollection().get();
    let usernameExists = false;
    
    usersSnapshot.forEach(doc => {
      if (doc.data().username === username) {
        usernameExists = true;
      }
    });
    
    if (usernameExists) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const newUser = {
      first_name,
      last_name,
      email,
      contact,
      address,
      dob,
      age,
      gender,
      username,
      password,
      role,
      status: 'active',
      created_at: FieldValue.serverTimestamp()
    };

    await getUsersCollection().add(newUser);

    // ✅ MIRROR TO MYSQL
    await mysqlQuery(
      'INSERT INTO users (username, password, role, email, first_name, last_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, password, role, email || '', first_name || '', last_name || '', 'active']
    );

    res.json({ message: "Registration successful!" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const body = req.body || {};
    const { username, password } = body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // ✅ FIX: Fetch all users and filter in-memory (works with mock Firestore)
    const usersSnapshot = await getUsersCollection().get();
    let foundUser = null;
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.username === username && data.password === password) {
        foundUser = { id: doc.id, ...data };
      }
    });

    if (!foundUser) {
      return res.status(401).json({ error: "Invalid login!" });
    }

    res.json({ user: foundUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== STUDENTS =====================
app.get("/api/students", async (req, res) => {
  try {
    const studentsSnapshot = await getStudentsCollection().get();
    
    const students = [];
    studentsSnapshot.forEach(doc => {
      const studentData = doc.data();
      studentData.id = doc.id;
      students.push(studentData);
    });

    // Get all transactions to attach to students
    const transactionsSnapshot = await getTransactionsCollection().get();
    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      const transactionData = doc.data();
      transactionData.id = doc.id;
      transactions.push(transactionData);
    });

    // Attach transactions to each student
    const result = students.map(s => ({
      ...s,
      transactions: transactions
        .filter(t => t.studentId === s.studentId)
        .map(t => ({ ...t, receipt: t.receipt || "" }))
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== ADD STUDENT =====================
app.post("/api/students", upload.single('receipt'), async (req, res) => {
  try {
    // Ensure req.body exists before destructuring
    const body = req.body || {};
    const { studentId, firstName, middleName, lastName, course, year, transactions } = body;

    if (!studentId || !firstName || !lastName || !course || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if studentId already exists
    const existingStudentSnapshot = await getStudentsCollection()
      .where('studentId', '==', studentId)
      .limit(1)
      .get();
      
    if (!existingStudentSnapshot.empty) {
      return res.status(409).json({ error: 'Student ID already exists' });
    }

    const newStudent = {
      studentId,
      firstName,
      middleName,
      lastName,
      course,
      year,
      created_at: FieldValue.serverTimestamp()
    };

    const studentRef = await getStudentsCollection().add(newStudent);

    // ===================== MYSQL TRANSACTION START =====================
    // This satisfies the requirement for BEGIN, COMMIT, ROLLBACK
    const connection = await getTransaction();
    try {
      await connection.beginTransaction(); // <--- START TRANSACTION (BEGIN)

      // 1. Insert Student
      await connection.execute(
        'INSERT INTO students (student_id, first_name, middle_name, last_name, course, year) VALUES (?, ?, ?, ?, ?, ?)',
        [studentId, firstName, middleName || '', lastName, course, year]
      );

      // 2. Insert Transactions (if any)
      if (transactions && Array.isArray(transactions)) {
        for (const transaction of transactions) {
          let receiptPath = transaction.receipt || '';
          if (req.file && transactions.length === 1) {
            receiptPath = `/uploads/${req.file.filename}`;
          }

          await connection.execute(
            'INSERT INTO transactions (student_id, fee_type, amount, balance, status, method, date, receipt_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [studentId, transaction.fee || '', transaction.amount || 0, transaction.balance || 0, transaction.status || 'pending', transaction.method || '', transaction.date || null, receiptPath]
          );
        }
      }

      await connection.commit(); // <--- COMMIT
      console.log('MySQL Transaction Committed successfully');
    } catch (sqlError) {
      await connection.rollback(); // <--- ROLLBACK (If anything fails)
      console.error('MySQL Transaction Failed, Rolled Back:', sqlError);
    } finally {
      connection.release(); // Free the connection
    }
    // ===================== MYSQL TRANSACTION END =====================

    // If transactions were provided, add them to Firestore (already handled by the logic above)
    if (transactions && Array.isArray(transactions)) {
      for (const transaction of transactions) {
        let receiptPath = transaction.receipt || '';
        if (req.file && transactions.length === 1) {
          receiptPath = `/uploads/${req.file.filename}`;
        }
        
        await getTransactionsCollection().add({
          ...transaction,
          receipt: receiptPath,
          studentId,
          created_at: FieldValue.serverTimestamp()
        });
      }
    }

    res.json({ message: "Student added successfully!", id: studentRef.id });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== UPDATE STUDENT =====================
app.put("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Ensure req.body exists before destructuring
    const body = req.body || {};
    const { firstName, middleName, lastName, course, year } = body;

    if (!firstName || !lastName || !course || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const studentRef = getStudentsCollection().doc(id);
    const updateData = {
      firstName,
      middleName,
      lastName,
      course,
      year
    };

    await studentRef.update(updateData);

    // ✅ MIRROR TO MYSQL
    // Since we don't have the studentId in the URL, we might need to fetch it or use the document ID if they match
    // For this project, let's assume we can find the student by their document ID in a real migration, 
    // but here we'll use a safer approach.
    const studentDoc = await studentRef.get();
    const sData = studentDoc.data();
    await mysqlQuery(
      'UPDATE students SET first_name = ?, middle_name = ?, last_name = ?, course = ?, year = ? WHERE student_id = ?',
      [firstName, middleName || '', lastName, course, year, sData.studentId]
    );

    res.json({ message: "Student updated successfully!" });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== DELETE STUDENT =====================
app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params; // 使用 req.params.id 获取 studentId

    const studentDoc = await getStudentsCollection().doc(id).get();
    const sData = studentDoc.data();

    // Delete the student document
    await getStudentsCollection().doc(id).delete();

    // ✅ MIRROR TO MYSQL
    if (sData && sData.studentId) {
      await mysqlQuery('DELETE FROM students WHERE student_id = ?', [sData.studentId]);
    }

    // Delete all transactions for this student
    const actualStudentId = sData ? sData.studentId : id;
    const transactionsSnapshot = await getTransactionsCollection()
      .where('studentId', '==', actualStudentId)
      .get();

    const batch = firestore.batch();
    transactionsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ message: "Student and related transactions deleted successfully!" });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== TRANSACTIONS =====================
app.get("/api/transactions", async (req, res) => {
  try {
    const transactionsSnapshot = await getTransactionsCollection().get();
    
    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      const transactionData = doc.data();
      transactionData.id = doc.id;
      transactions.push(transactionData);
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/transactions", upload.single('receipt'), async (req, res) => {
  try {
    // Ensure req.body exists before destructuring
    const body = req.body || {};
    const { studentId, fee, amount, balance, status, method, date } = body;
    
    if (!studentId || !fee || !amount || !method || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Handle receipt file if provided
    let receiptPath = '';
    if (req.file) {
      receiptPath = `/uploads/${req.file.filename}`;
    } else {
      // If no file uploaded but receipt data passed in body
      receiptPath = body.receipt || '';
    }

    const newTransaction = {
      studentId,
      fee,
      amount: parseFloat(amount),
      balance: parseFloat(balance || 0),
      status,
      method,
      date,
      receipt: receiptPath,  // Store the path to the uploaded file
      created_at: FieldValue.serverTimestamp()
    };

    const transactionRef = await getTransactionsCollection().add(newTransaction);

    // ✅ MIRROR TO MYSQL
    await mysqlQuery(
      'INSERT INTO transactions (student_id, fee_type, amount, balance, status, method, date, receipt_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [studentId, fee, amount, balance, status, method, date, receiptPath]
    );

    res.json({ message: "Transaction added successfully!", id: transactionRef.id });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await getTransactionsCollection().doc(id).delete();
    res.json({ message: "Transaction deleted successfully!" });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== APPROVAL REQUESTS =====================
app.post("/api/approvals", async (req, res) => {
  try {
    // Ensure req.body exists before destructuring
    const body = req.body || {};
    const { requestedBy, studentId, studentName, requestedData, originalData } = body;

    if (!requestedBy || !studentId || !studentName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newApprovalRequest = {
      requestedBy,
      studentId,
      studentName,
      requestedData,
      originalData,
      status: 'pending',
      created_at: FieldValue.serverTimestamp()
    };

    await getApprovalRequestsCollection().add(newApprovalRequest);
    res.json({ message: "Approval request submitted successfully!" });
  } catch (error) {
    console.error('Error submitting approval request:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/approvals/pending", async (req, res) => {
  try {
    const approvalsSnapshot = await getApprovalRequestsCollection()
      .where('status', '==', 'pending')
      .get();
    
    const approvals = [];
    approvalsSnapshot.forEach(doc => {
      const approvalData = doc.data();
      approvalData.id = doc.id;
      if (approvalData.created_at && typeof approvalData.created_at.toDate === 'function') {
        approvalData.created_at = approvalData.created_at.toDate().toISOString();
      }
      approvals.push(approvalData);
    });

    res.json(approvals);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/approvals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Ensure req.body exists before destructuring
    const body = req.body || {};
    const { status } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const approvalRef = getApprovalRequestsCollection().doc(id);
    await approvalRef.update({ 
      status,
      updated_at: FieldValue.serverTimestamp()
    });

    // If approved, update the corresponding record
    if (status === 'approved') {
      const approvalDoc = await approvalRef.get();
      const approvalData = approvalDoc.data();

      if (approvalData.requestedData && approvalData.requestedData.type === 'student_update') {
        // Update student info based on the approval request
        const studentSnapshot = await getStudentsCollection()
          .where('studentId', '==', approvalData.studentId)
          .limit(1)
          .get();

        if (!studentSnapshot.empty) {
          const studentDoc = studentSnapshot.docs[0];
          await studentDoc.ref.update(approvalData.requestedData.data);

          // ✅ MIRROR TO MYSQL
          const { firstName, middleName, lastName, course, year } = approvalData.requestedData.data;
          await mysqlQuery(
            'UPDATE students SET first_name = ?, middle_name = ?, last_name = ?, course = ?, year = ? WHERE student_id = ?',
            [firstName, middleName || '', lastName, course, year, approvalData.studentId]
          );
        }
      } else if (approvalData.requestedData && approvalData.requestedData.type === 'transaction_delete') {
        const transId = approvalData.requestedData.data.id;
        if (transId) {
          await getTransactionsCollection().doc(transId).delete();
        }
      } else if (approvalData.requestedData && approvalData.requestedData.type === 'student_delete') {
        let studentDocId = approvalData.requestedData.data.id;
        let sData = null;

        // Try getting by document ID first
        if (studentDocId) {
          const studentDoc = await getStudentsCollection().doc(studentDocId).get();
          if (studentDoc.exists) {
            sData = studentDoc.data();
          }
        }

        // Fallback: If document ID fails, find by studentId
        if (!sData && approvalData.studentId) {
          const studentSnapshot = await getStudentsCollection()
            .where('studentId', '==', approvalData.studentId)
            .limit(1)
            .get();

          if (!studentSnapshot.empty) {
            studentDocId = studentSnapshot.docs[0].id;
            sData = studentSnapshot.docs[0].data();
          }
        }

        if (studentDocId && sData) {
          // Delete from Firestore
          await getStudentsCollection().doc(studentDocId).delete();

          if (sData.studentId) {
            // Delete from MySQL (both students and transactions)
            await mysqlQuery('DELETE FROM transactions WHERE student_id = ?', [sData.studentId]);
            await mysqlQuery('DELETE FROM students WHERE student_id = ?', [sData.studentId]);

            // Delete transactions from Firestore
            const transactionsSnapshot = await getTransactionsCollection()
              .where('studentId', '==', sData.studentId)
              .get();
            const batch = firestore.batch();
            transactionsSnapshot.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
          }
        }
      }
    }

    res.json({ message: "Approval updated successfully!" });
  } catch (error) {
    console.error('Error updating approval:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== NOTIFICATIONS =====================
app.get("/api/notifications", async (req, res) => {
  try {
    const { role } = req.query;
    let query = getNotificationsCollection();

    const notificationsSnapshot = await getNotificationsCollection().get();
    
    let notifications = [];
    notificationsSnapshot.forEach(doc => {
      const notificationData = doc.data();
      notificationData.id = doc.id;
      
      // Store original for sorting, but replace for JSON serialization
      notificationData._sortTime = notificationData.created_at ? 
        (typeof notificationData.created_at.toMillis === 'function' ? notificationData.created_at.toMillis() : new Date(notificationData.created_at).getTime()) : 0;
        
      if (notificationData.created_at && typeof notificationData.created_at.toDate === 'function') {
        notificationData.created_at = notificationData.created_at.toDate().toISOString();
      }
      notifications.push(notificationData);
    });

    if (role) {
      notifications = notifications.filter(n => n.recipientRole === role);
    }

    // Sort in memory by _sortTime desc
    notifications.sort((a, b) => {
      return b._sortTime - a._sortTime;
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/notifications", async (req, res) => {
  try {
    // Ensure req.body exists before destructuring
    const body = req.body || {};
    const { recipientRole, message } = body;

    if (!recipientRole || !message) {
      return res.status(400).json({ error: 'Recipient role and message are required' });
    }

    const newNotification = {
      recipientRole,
      message,
      isRead: false,
      created_at: FieldValue.serverTimestamp()
    };

    const notificationRef = await getNotificationsCollection().add(newNotification);
    res.json({ message: "Notification created successfully!", id: notificationRef.id });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await getNotificationsCollection().doc(id).delete();
    res.json({ message: "Notification deleted successfully!" });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    await getNotificationsCollection().doc(id).update({ isRead: body.isRead });
    res.json({ message: "Notification updated successfully!" });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to serve receipt images
app.get("/api/receipt/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the transaction by ID
    const transactionDoc = await getTransactionsCollection().doc(id).get();
    
    if (!transactionDoc.exists) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    const transactionData = transactionDoc.data();
    const receiptPath = transactionData.receipt;
    
    if (!receiptPath) {
      return res.status(404).json({ error: "Receipt not found" });
    }
    
    // Check if receipt is a local file path or base64 data
    if (receiptPath.startsWith('data:')) {
      // Base64 encoded image
      const imageData = receiptPath.split(',')[1]; // Get the base64 part
      const mimeType = receiptPath.split(';')[0].split(':')[1]; // Get the mime type
      
      res.set('Content-Type', mimeType);
      res.send(Buffer.from(imageData, 'base64'));
    } else {
      // Regular file path
      const filePath = path.join(__dirname, receiptPath);
      res.sendFile(filePath);
    }
  } catch (error) {
    console.error('Error serving receipt:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== START SERVER =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("Connected to Firebase Firestore!");
});