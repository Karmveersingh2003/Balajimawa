import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import './App.css';
import signatureImage from './signature.png';

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

function App() {
    const invoiceRef = useRef(null);
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [items, setItems] = useState([{ name: '', qty: '', rate: '' }]);
    const [gstPercentage, setGstPercentage] = useState(18);
    const [loading, setLoading] = useState(false);

    const invoiceNumber = `BMB-${Math.floor(100000 + Math.random() * 900000)}`;
    const date = new Date().toLocaleDateString('en-GB');

    const handleItemChange = (index, event) => {
        const { name, value } = event.target;
        const list = [...items];
        list[index][name] = value;
        setItems(list);
    };

    const handleAddItem = () => setItems([...items, { name: '', qty: '', rate: '' }]);

    const handleRemoveItem = (index) => {
        const list = [...items];
        list.splice(index, 1);
        setItems(list);
    };

    const calculateTotal = (qty, rate) => (parseFloat(qty) * parseFloat(rate)) || 0;
    const subTotal = items.reduce((acc, item) => acc + calculateTotal(item.qty, item.rate), 0);
    const cgst = (subTotal * (gstPercentage / 2)) / 100;
    const sgst = (subTotal * (gstPercentage / 2)) / 100;
    const grandTotal = subTotal + cgst + sgst;

    const handleSaveAndDownload = async () => {
        if (!customerName || !customerMobile) {
            alert('Please enter Customer Name and Mobile Number.');
            return;
        }
        if (items.some(item => !item.name || !item.qty || !item.rate)) {
            alert('Please fill all item details before saving.');
            return;
        }
        setLoading(true);

        const billData = {
            invoiceNumber, date: new Date(), customerName, customerMobile,
            items: items.map((item, index) => ({ ...item, sno: index + 1, total: calculateTotal(item.qty, item.rate) })),
            subTotal, gstPercentage, cgst, sgst, grandTotal,
        };

        try {
            const response = await fetch('http://localhost:5001/api/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(billData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to save bill.');
            
            alert(`Bill Saved! Invoice #: ${result.bill.invoiceNumber}. Downloading image...`);

            if (invoiceRef.current) {
                const dataUrl = await toPng(invoiceRef.current, { pixelRatio: 2.5, quality: 1.0 });
                const link = document.createElement('a');
                link.download = `Balaji-Mawa-Invoice-${invoiceNumber}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (error) {
            console.error('Error in operation:', error);
            alert(`Operation Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            {/* --- THE CONTROL PANEL (All inputs go here) --- */}
            <div className="control-panel">
                <div className="control-panel-section">
                    <h3>Customer Details</h3>
                    <div className="grid-form">
                        <div className="form-group">
                            <label htmlFor="customerName">Name</label>
                            <input id="customerName" type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g., Ankit Sharma" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="customerMobile">Mobile</label>
                            <input id="customerMobile" type="tel" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} placeholder="e.g., 9876543210" />
                        </div>
                    </div>
                </div>

                <div className="control-panel-section">
                    <h3>Items</h3>
                    {items.map((item, index) => (
                        <div key={index} className="item-entry">
                            <div className="form-group">
                                <label>Item Name</label>
                                <input type="text" name="name" value={item.name} onChange={(e) => handleItemChange(index, e)} placeholder="Mawa, Paneer, etc."/>
                            </div>
                            <div className="form-group">
                                <label>Quantity</label>
                                <input type="number" name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} placeholder="e.g., 1.5"/>
                            </div>
                            <div className="form-group">
                                <label>Rate (₹)</label>
                                <input type="number" name="rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} placeholder="e.g., 350"/>
                            </div>
                            <button className="remove-icon-btn" onClick={() => handleRemoveItem(index)} aria-label="Remove Item">
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                    <div className="item-controls">
                        <button className="add-item-btn" onClick={handleAddItem}>+ Add Item</button>
                    </div>
                </div>

                <div className="control-panel-section">
                    <h3>Tax Details</h3>
                     <div className="form-group" style={{maxWidth: '150px'}}>
                        <label htmlFor="gst">GST Percentage (%)</label>
                        <input id="gst" type="number" value={gstPercentage} onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)} />
                    </div>
                </div>
            </div>

            {/* --- THE LIVE BILL PREVIEW (This gets downloaded) --- */}
            <div className="invoice-paper" ref={invoiceRef}>
                <header className="invoice-header">
                    <h1>Balaji Mawa</h1>
                    <p>GSTIN: 08AHGPR9633M2ZJ</p>
                    <p>Mobile: 9829572755 |Mobile: 9636000577 | Address: Baldev Nagar,Jodhpur 342001</p>
                    
                </header>
                <section className="details-section">
                    <div>
                        <p><strong>Bill To:</strong> {customerName || '____________________'}</p>
                        <p><strong>Mobile:</strong> {customerMobile || '____________________'}</p>
                    </div>
                    <div>
                        <p><strong>Invoice:</strong> {invoiceNumber}</p>
                        <p><strong>Date:</strong> {date}</p>
                    </div>
                </section>
                <section className="items-section">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th className="sno">#</th>
                                <th>Item Description</th>
                                <th className="align-right">Qty</th>
                                <th className="align-right">Rate (₹)</th>
                                <th className="align-right">Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td className="sno">{index + 1}</td>
                                    <td>{item.name || '...'}</td>
                                    <td className="align-right">{item.qty || '...'}</td>
                                    <td className="align-right">{item.rate ? parseFloat(item.rate).toFixed(2) : '...'}</td>
                                    <td className="align-right"><strong>{calculateTotal(item.qty, item.rate).toFixed(2)}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                <div className="bill-summary">
                    <div className="invoice-footer">
                        <img src={signatureImage} alt="Signature" className="signature-img" />
                        <p>Authorised Signatory</p>
                    </div>
                    <table className="totals-table">
                        <tbody>
                            <tr><td className="label">Sub Total:</td><td className="value">₹{subTotal.toFixed(2)}</td></tr>
                            <tr><td className="label">CGST @ {(gstPercentage / 2).toFixed(2)}%</td><td className="value">₹{cgst.toFixed(2)}</td></tr>
                            <tr><td className="label">SGST @ {(gstPercentage / 2).toFixed(2)}%</td><td className="value">₹{sgst.toFixed(2)}</td></tr>
                            <tr className="grand-total"><td className="label">Grand Total:</td><td className="value">₹{grandTotal.toFixed(2)}</td></tr>
                        </tbody>
                    </table>
                </div>
                 <p id='rupee'>₹🆙PhonePe Number: 9829572755 </p>
            </div>

            {/* --- THE FINAL ACTION BUTTON --- */}
            <div className="action-section">
                <button className="save-download-btn" onClick={handleSaveAndDownload} disabled={loading}>
                    {loading ? 'Processing...' : (<><DownloadIcon /> Save & Download Bill</>)}
                </button>
            </div>
        </div>
    );
}

export default App;