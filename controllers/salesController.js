import pool from '../config/db.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// GET /api/sales
export const getSales = async (_, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, o.payment_method, u.name customer_name
     FROM sales s JOIN orders o ON s.order_id=o.id
     JOIN users u ON o.user_id=u.id ORDER BY s.sale_date DESC`);
  res.json(rows);
};

// DELETE /api/sales/reset
export const resetSales = async (_, res) => {
  await pool.query('TRUNCATE TABLE sales RESTART IDENTITY CASCADE');
  res.json({ message: 'Sales reset successful' });
};

// GET /api/sales/export/excel
export const exportExcel = async (_, res) => {
  const { rows } = await pool.query(
    `SELECT s.id, o.id AS order_id, u.name AS customer, o.payment_method,
            s.total_sales_price, s.total_profit, s.sale_date
     FROM sales s JOIN orders o ON s.order_id=o.id
     JOIN users u ON o.user_id=u.id ORDER BY s.sale_date DESC`);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sales Report');
  ws.columns = [
    { header: 'Sale ID',     key: 'id',                 width: 10 },
    { header: 'Order ID',    key: 'order_id',           width: 10 },
    { header: 'Customer',    key: 'customer',           width: 25 },
    { header: 'Payment',     key: 'payment_method',     width: 12 },
    { header: 'Total Sales', key: 'total_sales_price',  width: 15 },
    { header: 'Profit',      key: 'total_profit',       width: 15 },
    { header: 'Date',        key: 'sale_date',          width: 22 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: 'FF00E5FF' } };
  rows.forEach(r => ws.addRow(r));

  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition','attachment; filename=ZanTech-Sales.xlsx');
  await wb.xlsx.write(res);
  res.end();
};

// GET /api/sales/export/pdf
export const exportPDF = async (_, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, u.name customer FROM sales s
     JOIN orders o ON s.order_id=o.id
     JOIN users u  ON o.user_id=u.id ORDER BY s.sale_date DESC`);

  const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition','attachment; filename=ZanTech-Report.pdf');
  doc.pipe(res);

  // Header
  doc.fillColor('#00e5ff').fontSize(26).text('ZANTECH MART', { align: 'center' });
  doc.fillColor('#000').fontSize(14).text('Sales & Profit Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke('#00e5ff');
  doc.moveDown();

  // Table header
  doc.fontSize(11).fillColor('#00e5ff')
     .text('ID',40,doc.y,{continued:true,width:40})
     .text('Order',80,undefined,{continued:true,width:60})
     .text('Customer',140,undefined,{continued:true,width:150})
     .text('Sales',290,undefined,{continued:true,width:80})
     .text('Profit',370,undefined,{continued:true,width:80})
     .text('Date',450);
  doc.moveDown(0.3); doc.fillColor('#000');

  let totalSales = 0, totalProfit = 0;
  rows.forEach(r => {
    totalSales  += Number(r.total_sales_price);
    totalProfit += Number(r.total_profit);
    doc.fontSize(10)
       .text(r.id,40,doc.y,{continued:true,width:40})
       .text(r.order_id,80,undefined,{continued:true,width:60})
       .text(r.customer,140,undefined,{continued:true,width:150})
       .text(`$${r.total_sales_price}`,290,undefined,{continued:true,width:80})
       .text(`$${r.total_profit}`,370,undefined,{continued:true,width:80})
       .text(new Date(r.sale_date).toLocaleDateString(),450);
  });

  doc.moveDown(); doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke('#00e5ff');
  doc.moveDown();
  doc.fontSize(12).fillColor('#00e5ff')
     .text(`TOTAL SALES:  $${totalSales.toFixed(2)}`, { align: 'right' })
     .text(`TOTAL PROFIT: $${totalProfit.toFixed(2)}`, { align: 'right' });
  doc.end();
};