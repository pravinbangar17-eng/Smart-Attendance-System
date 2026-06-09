// reports.js
// Automated Report Generator for AI Attendance System

class AttendanceReportGenerator {
  constructor() {}

  // Filter logs based on inputs
  filterLogs(logs, students, filters) {
    const { startDate, endDate, department, threshold } = filters;
    
    // 1. Filter logs by date range
    let filtered = logs.filter(log => {
      const logDate = log.date;
      return logDate >= startDate && logDate <= endDate;
    });

    // 2. Filter by department
    if (department && department !== 'ALL') {
      filtered = filtered.filter(log => log.department === department);
    }

    // 3. Aggregate student attendance percentages within this range
    // Group logs by student ID
    const studentStats = {};
    students.forEach(student => {
      if (department && department !== 'ALL' && student.department !== department) {
        return; // Skip if student not in selected department
      }
      studentStats[student.id] = {
        id: student.id,
        name: student.name,
        department: student.department,
        present: 0,
        late: 0,
        absent: 0,
        total: 0
      };
    });

    filtered.forEach(log => {
      if (studentStats[log.studentId]) {
        studentStats[log.studentId].total++;
        if (log.status === 'Present') studentStats[log.studentId].present++;
        else if (log.status === 'Late') studentStats[log.studentId].late++;
        else if (log.status === 'Absent') studentStats[log.studentId].absent++;
      }
    });

    // Calculate rates and filter by threshold
    const reportData = [];
    Object.keys(studentStats).forEach(id => {
      const stats = studentStats[id];
      if (stats.total === 0) return; // No classes in range

      const attendanceCount = stats.present + stats.late;
      const rate = (attendanceCount / stats.total) * 100;

      // Filter by threshold (e.g. search students under 75%)
      if (threshold) {
        if (rate > parseFloat(threshold)) return; // Exclude if above threshold
      }

      reportData.push({
        id: stats.id,
        name: stats.name,
        department: stats.department,
        present: stats.present,
        late: stats.late,
        absent: stats.absent,
        total: stats.total,
        rate: rate.toFixed(1)
      });
    });

    return reportData;
  }

  // Generate and Download CSV File
  exportToCSV(reportData, dateRangeStr) {
    if (reportData.length === 0) {
      alert('No data available to export.');
      return;
    }

    // Header row
    const headers = ['Student ID', 'Student Name', 'Department', 'Classes Present', 'Classes Late', 'Classes Absent', 'Total Sessions', 'Attendance Rate (%)'];
    const rows = [headers];

    // Data rows
    reportData.forEach(item => {
      rows.push([
        item.id,
        `"${item.name}"`,
        item.department,
        item.present,
        item.late,
        item.absent,
        item.total,
        item.rate
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${dateRangeStr.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Generate and print beautiful PDF report
  exportToPDF(reportData, filters, deptName) {
    if (reportData.length === 0) {
      alert('No data available to print.');
      return;
    }

    // Open a print window
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    
    // Construct HTML document with CSS print stylesheet
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Campus Smart Attendance Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Outfit', sans-serif;
            color: #1a1f36;
            margin: 40px;
            font-size: 14px;
            line-height: 1.5;
          }
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title-area h1 {
            font-size: 26px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 6px 0;
          }
          .title-area p {
            font-size: 13px;
            color: #64748b;
            margin: 0;
          }
          .meta-area {
            text-align: right;
            font-size: 13px;
            color: #475569;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
          }
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
          }
          .summary-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 6px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .summary-val {
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            margin-top: 20px;
          }
          .report-table th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            padding: 12px 14px;
            border-bottom: 2px solid #cbd5e1;
          }
          .report-table td {
            padding: 12px 14px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .report-table tr:nth-child(even) {
            background: #f8fafc;
          }
          .badge-risk {
            background: #fef2f2;
            color: #ef4444;
            border: 1px solid #fecaca;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
          }
          .badge-safe {
            background: #f0fdf4;
            color: #22c55e;
            border: 1px solid #bbf7d0;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
          }
          .report-footer {
            margin-top: 60px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
          @media print {
            body { margin: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="title-area">
            <h1>Campus Smart Attendance System</h1>
            <p>AI-Powered Liveness Verification & Attendance Ledger</p>
          </div>
          <div class="meta-area">
            <div><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Report Range:</strong> ${filters.startDate} to ${filters.endDate}</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Department / Filter</div>
            <div class="summary-val">${deptName}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Students Tracked</div>
            <div class="summary-val">${reportData.length}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Average Attendance Rate</div>
            <div class="summary-val">
              ${(reportData.reduce((acc, curr) => acc + parseFloat(curr.rate), 0) / reportData.length || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Dept</th>
              <th>Present</th>
              <th>Late</th>
              <th>Absent</th>
              <th>Rate (%)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(item => {
              const hasRisk = parseFloat(item.rate) < 75.0;
              const badge = hasRisk 
                ? '<span class="badge-risk">At Risk</span>' 
                : '<span class="badge-safe">Satisfactory</span>';
              return `
                <tr>
                  <td><strong>${item.id}</strong></td>
                  <td>${item.name}</td>
                  <td>${item.department}</td>
                  <td>${item.present}</td>
                  <td>${item.late}</td>
                  <td>${item.absent}</td>
                  <td><strong>${item.rate}%</strong></td>
                  <td>${badge}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="report-footer">
          <p>Generated by AI Smart Attendance System. Verification logs synced securely to Cloud Database ledger.</p>
          <p>&copy; 2026 Smart Campus Exhibition System. All Rights Reserved.</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

// Instantiate and expose globally
const reportGenerator = new AttendanceReportGenerator();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = reportGenerator;
} else {
  window.reportGenerator = reportGenerator;
}
