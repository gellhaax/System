
app.get("/api/students", async (req, res) => {
  try {
    const studentsSnapshot = await getStudentsCollection().get();
    
    const students = [];
    studentsSnapshot.forEach(doc => {
      const studentData = doc.data();
      const cleanStudent = { ...studentData };
      // Convert server timestamp to ISO string
      if (cleanStudent.created_at && typeof cleanStudent.created_at.toDate === 'function') {
        cleanStudent.created_at = cleanStudent.created_at.toDate().toISOString();
      }
      cleanStudent.id = doc.id;
      students.push(cleanStudent);
    });

    const transactionsSnapshot = await getTransactionsCollection().get();
    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      const transactionData = doc.data();
      const cleanTransaction = { ...transactionData };
      if (cleanTransaction.created_at && typeof cleanTransaction.created_at.toDate === 'function') {
        cleanTransaction.created_at = cleanTransaction.created_at.toDate().toISOString();
      }
      cleanTransaction.id = doc.id;
      transactions.push(cleanTransaction);
    });

    const result = students.map(s => ({
      ...s,
      transactions: transactions
        .filter(t => t.studentId === s.studentId)
        .map(t => ({ ...t, receipt: t.receipt || "" }))
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});