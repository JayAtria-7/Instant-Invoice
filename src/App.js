import React, { useState, useEffect, useRef } from 'react';
import BillDetails from './components/BillDetails';
import ItemList from './components/ItemList';
import TotalAmount from './components/TotalAmount';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReactToPrint } from 'react-to-print';
import './App.css';

function App() {
    // --- State Variables ---
    const [items, setItems] = useState([]);
    const [clientDetails, setClientDetails] = useState({ name: '', address: '', email: '', phone: '' });
    // Added Company Details State
    const [companyDetails, setCompanyDetails] = useState({
        name: 'Your Company LLC',
        address: '123 Main St, Anytown, USA',
        email: 'contact@yourcompany.com',
        phone: '555-1234'
        // Logo state omitted - requires backend/complex frontend handling
    });
    const [invoiceMeta, setInvoiceMeta] = useState({
        invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        status: 'Draft' // Added Status State
    });
    const [taxRate, setTaxRate] = useState(0);
    const [discount, setDiscount] = useState({ type: 'percentage', value: 0 });
    const [currencySymbol, setCurrencySymbol] = useState('$'); // Added Currency State
    const [editingIndex, setEditingIndex] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [savedInvoices, setSavedInvoices] = useState([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

    // Ref for react-to-print
    const invoiceRef = useRef();

    // --- Effects ---
    useEffect(() => {
        const storedInvoices = localStorage.getItem('savedInvoices');
        if (storedInvoices) {
            setSavedInvoices(JSON.parse(storedInvoices));
        }
        // Load company details if saved? Optional enhancement.
        // const storedCompany = localStorage.getItem('companyDetails');
        // if (storedCompany) {
        //     setCompanyDetails(JSON.parse(storedCompany));
        // }
    }, []);

    // --- Handlers ---
    const handleClientChange = (e) => {
        const { name, value } = e.target;
        setClientDetails(prev => ({ ...prev, [name]: value }));
    };

    // Added Handler for Company Details
    const handleCompanyChange = (e) => {
        const { name, value } = e.target;
        setCompanyDetails(prev => ({ ...prev, [name]: value }));
        // Optional: Save company details persistently
        // localStorage.setItem('companyDetails', JSON.stringify({ ...companyDetails, [name]: value }));
    };


    const handleMetaChange = (e) => {
        const { name, value } = e.target;
        setInvoiceMeta(prev => ({ ...prev, [name]: value })); // Handles status dropdown as well now
    };

    const handleTaxChange = (e) => {
        setTaxRate(Number(e.target.value) || 0);
    };

    const handleDiscountChange = (e) => {
        const { name, value } = e.target;
        if (name === 'discountType') {
            setDiscount(prev => ({ ...prev, type: value }));
        } else {
            setDiscount(prev => ({ ...prev, value: Number(value) || 0 }));
        }
    };

    // Added Handler for Currency Change
    const handleCurrencyChange = (e) => {
        setCurrencySymbol(e.target.value);
    };

    const handleSaveItem = (newItemData) => {
         const quantity = Number(newItemData.quantity) || 0;
         const price = Number(newItemData.price) || 0;
         if (quantity <= 0 || price < 0) {
             alert("Quantity must be positive and Price cannot be negative.");
             return;
         }
         const itemWithParsedNumbers = { ...newItemData, quantity, price };

        if (editingIndex !== null) {
            const updatedItems = items.map((item, index) => index === editingIndex ? itemWithParsedNumbers : item);
            setItems(updatedItems);
            setEditingIndex(null);
            setItemToEdit(null);
        } else {
            setItems([...items, itemWithParsedNumbers]);
        }
    };

    const handleDeleteItem = (indexToDelete) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
             setItems(items.filter((_, index) => index !== indexToDelete));
             if (indexToDelete === editingIndex) { setEditingIndex(null); setItemToEdit(null); }
        }
    };

    const handleEditItem = (index) => {
        setEditingIndex(index);
        setItemToEdit(items[index]);
    };

    // --- Calculation Logic ---
    const calculateTotals = () => {
        // (Calculation logic remains the same as previous version)
        const subtotal = items.reduce((total, item) => total + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
        let discountAmount = 0;
        if (discount.type === 'percentage') { discountAmount = subtotal * (discount.value / 100); }
        else { discountAmount = discount.value; }
        discountAmount = Math.min(subtotal, discountAmount);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (taxRate / 100);
        const grandTotal = taxableAmount + taxAmount;
        return { subtotal, discountAmount, taxAmount, grandTotal };
    };

    const totals = calculateTotals();

    // --- Save/Load Logic (Updated to include new state) ---
     const handleSaveInvoice = () => {
        const invoiceId = invoiceMeta.invoiceNumber || `INV-${Date.now()}`;
        if (!invoiceMeta.invoiceNumber) { alert("Please enter an Invoice Number before saving."); return; }

        const currentInvoiceState = {
            id: invoiceId,
            items,
            clientDetails,
            companyDetails, // Save company details
            invoiceMeta: { ...invoiceMeta, invoiceNumber: invoiceId }, // Save status here
            taxRate,
            discount,
            currencySymbol, // Save currency
            totals
        };

        const existingInvoiceIndex = savedInvoices.findIndex(inv => inv.id === invoiceId);
        let updatedSavedInvoices;
        if (existingInvoiceIndex > -1) {
             if (!window.confirm(`Invoice ${invoiceId} already exists. Overwrite?`)) { return; }
             updatedSavedInvoices = [...savedInvoices];
             updatedSavedInvoices[existingInvoiceIndex] = currentInvoiceState;
        } else {
             updatedSavedInvoices = [...savedInvoices, currentInvoiceState];
        }

        setSavedInvoices(updatedSavedInvoices);
        localStorage.setItem('savedInvoices', JSON.stringify(updatedSavedInvoices));
        setSelectedInvoiceId(invoiceId);
        alert(`Invoice ${invoiceId} saved!`);
    };

    const handleLoadInvoice = () => {
        if (!selectedInvoiceId) { alert('Please select an invoice to load.'); return; }
        const invoiceToLoad = savedInvoices.find(inv => inv.id === selectedInvoiceId);
        if (invoiceToLoad) {
            setItems(invoiceToLoad.items || []);
            setClientDetails(invoiceToLoad.clientDetails || { name: '', address: '', email: '', phone: '' });
            // Load Company Details if they were saved
            setCompanyDetails(invoiceToLoad.companyDetails || { name: '', address: '', email: '', phone: '' });
            // Load Status and other meta
            setInvoiceMeta(invoiceToLoad.invoiceMeta || { invoiceNumber: '', invoiceDate: '', dueDate: '', status: 'Draft' });
            setTaxRate(invoiceToLoad.taxRate || 0);
            setDiscount(invoiceToLoad.discount || { type: 'percentage', value: 0 });
            // Load Currency
            setCurrencySymbol(invoiceToLoad.currencySymbol || '$');
            setEditingIndex(null);
            setItemToEdit(null);
            alert(`Invoice ${selectedInvoiceId} loaded!`);
        } else {
            alert('Selected invoice not found in saved data.');
        }
    };

    const handleSelectInvoice = (e) => {
        setSelectedInvoiceId(e.target.value);
    };

    // --- PDF Generation (Updated) ---
    const handleDownloadPDF = () => {
        const pdf = new jsPDF('p', 'mm', 'a4'); // Standard A4 size
        const pageContent = () => {
            // --- Company Info / Logo (Logo requires complex handling or backend URL) ---
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text(companyDetails.name || 'Your Company', 14, 22);
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(9);
            // Basic address splitting (improve if needed)
            const compAddressLines = (companyDetails.address || '').split('\n');
            let compAddressY = 28;
            compAddressLines.forEach(line => {
                pdf.text(line, 14, compAddressY);
                compAddressY += 4;
            });
            pdf.text(companyDetails.email || '', 14, compAddressY);
            compAddressY += 4;
            pdf.text(companyDetails.phone || '', 14, compAddressY);

            // --- Invoice Meta ---
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text('INVOICE', 200, 22, { align: 'right' });
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(9);
            pdf.text(`Invoice #: ${invoiceMeta.invoiceNumber}`, 200, 32, { align: 'right' });
            pdf.text(`Status: ${invoiceMeta.status}`, 200, 37, { align: 'right' });
            pdf.text(`Date: ${invoiceMeta.invoiceDate}`, 200, 42, { align: 'right' });
            pdf.text(`Due Date: ${invoiceMeta.dueDate}`, 200, 47, { align: 'right' });

            // --- Client Info ---
             let clientStartY = compAddressY + 10; // Start below company info
            pdf.text('Bill To:', 14, clientStartY);
            pdf.text(clientDetails.name || '', 14, clientStartY + 5);
            const clientAddressLines = (clientDetails.address || '').split('\n');
            let clientAddressY = clientStartY + 10;
            clientAddressLines.forEach(line => {
                pdf.text(line, 14, clientAddressY);
                clientAddressY += 4;
            });
             pdf.text(clientDetails.email || '', 14, clientAddressY);
            clientAddressY += 4;
            pdf.text(clientDetails.phone || '', 14, clientAddressY);

            // --- Items Table ---
            const tableColumn = ["Item", "Quantity", "Price", "Total"];
            const tableRows = items.map(item => [
                item.item,
                item.quantity,
                `${currencySymbol}${Number(item.price).toFixed(2)}`,
                `${currencySymbol}${(item.quantity * item.price).toFixed(2)}`
            ]);

            autoTable(pdf, {
              head: [tableColumn],
              body: tableRows,
              // Corrected startY using clientAddressY:
              startY: clientAddressY + 10 > 60 ? clientAddressY + 10 : 60,
              theme: 'striped',
              headStyles: { fillColor: [34, 139, 34] },
              styles: { fontSize: 9 },
              columnStyles: {
                 2: { halign: 'right' },
                 3: { halign: 'right' }
              }
          });

            // --- Totals ---
            // Use clientAddressY in the fallback for finalY as well, if needed,
              // although pdf.lastAutoTable?.finalY should generally work.
            const finalY = pdf.lastAutoTable?.finalY || clientAddressY + 10;
            const totalsX = 140;
            const valueX = 196; // Right align value
            let currentY = finalY + 10;
            pdf.setFontSize(10);

            pdf.text(`Subtotal:`, totalsX, currentY);
            pdf.text(`${currencySymbol}${totals.subtotal.toFixed(2)}`, valueX, currentY, { align: 'right' });
            currentY += 7;

            if (totals.discountAmount > 0) {
                pdf.text(`Discount (${discount.type === 'percentage' ? `${discount.value}%` : `${currencySymbol}${discount.value}`}):`, totalsX, currentY);
                pdf.text(`-${currencySymbol}${totals.discountAmount.toFixed(2)}`, valueX, currentY, { align: 'right' });
                currentY += 7;
            }
            if (totals.taxAmount > 0) {
                pdf.text(`Tax (${taxRate}%):`, totalsX, currentY);
                pdf.text(`+${currencySymbol}${totals.taxAmount.toFixed(2)}`, valueX, currentY, { align: 'right' });
                currentY += 7;
            }

            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(`Total Amount:`, totalsX, currentY);
            pdf.text(`${currencySymbol}${totals.grandTotal.toFixed(2)}`, valueX, currentY, { align: 'right' });
            pdf.setFont(undefined, 'normal');
        }
        pageContent();
        pdf.save(`invoice-${invoiceMeta.invoiceNumber || 'details'}.pdf`);
    };

     // --- Print Functionality ---
     // eslint-disable-next-line no-unused-vars
     const handlePrint = useReactToPrint({
        content: () => invoiceRef.current,
     });

    // --- Render ---
    return (
        <div className="App">
            <h1>InstantInvoice: Generate Bills Online</h1>

            {/* --- Load Section --- */}
            <div className="load-section">
                <label htmlFor="load-invoice">Load Saved Invoice:</label>
                <select id="load-invoice" value={selectedInvoiceId} onChange={handleSelectInvoice}>
                    <option value="">-- Select Invoice --</option>
                    {savedInvoices.map(inv => (
                        <option key={inv.id} value={inv.id}>{inv.id} ({inv.clientDetails?.name || 'No Client'})</option>
                    ))}
                </select>
                <button onClick={handleLoadInvoice} disabled={!selectedInvoiceId}>Load Invoice</button>
            </div>

            {/* --- Company Details --- */}
            <div className="form-section">
                <h3>Your Company Details</h3>
                 <div className="form-grid">
                    <div>
                         <label htmlFor="companyName">Company Name:</label>
                         <input type="text" id="companyName" name="name" value={companyDetails.name} onChange={handleCompanyChange} />
                    </div>
                     <div>
                         <label htmlFor="companyAddress">Address:</label>
                         <textarea id="companyAddress" name="address" value={companyDetails.address} onChange={handleCompanyChange} rows="3"></textarea>
                     </div>
                     <div>
                         <label htmlFor="companyEmail">Email:</label>
                         <input type="email" id="companyEmail" name="email" value={companyDetails.email} onChange={handleCompanyChange} />
                     </div>
                     <div>
                        <label htmlFor="companyPhone">Phone:</label>
                        <input type="tel" id="companyPhone" name="phone" value={companyDetails.phone} onChange={handleCompanyChange} />
                     </div>
                 </div>
            </div>

             {/* --- Invoice Details --- */}
            <div className="form-section">
                <h3>Invoice Details</h3>
                 <div className="form-grid">
                    <div>
                         <label htmlFor="invoiceNumber">Invoice #:</label>
                         <input type="text" id="invoiceNumber" name="invoiceNumber" value={invoiceMeta.invoiceNumber} onChange={handleMetaChange} />
                    </div>
                     <div>
                         <label htmlFor="status">Status:</label>
                         <select id="status" name="status" value={invoiceMeta.status} onChange={handleMetaChange}>
                             <option value="Draft">Draft</option>
                             <option value="Sent">Sent</option>
                             <option value="Paid">Paid</option>
                             <option value="Partially Paid">Partially Paid</option>
                             <option value="Overdue">Overdue</option>
                         </select>
                     </div>
                    <div>
                         <label htmlFor="invoiceDate">Invoice Date:</label>
                         <input type="date" id="invoiceDate" name="invoiceDate" value={invoiceMeta.invoiceDate} onChange={handleMetaChange} />
                    </div>
                    <div>
                         <label htmlFor="dueDate">Due Date:</label>
                         <input type="date" id="dueDate" name="dueDate" value={invoiceMeta.dueDate} onChange={handleMetaChange} />
                    </div>
                    {/* Currency Selector */}
                    <div>
                         <label htmlFor="currency">Currency:</label>
                         <select id="currency" value={currencySymbol} onChange={handleCurrencyChange}>
                             <option value="$">$ (USD)</option>
                             <option value="€">€ (EUR)</option>
                             <option value="£">£ (GBP)</option>
                             <option value="₹">₹ (INR)</option>
                             {/* Add others */}
                         </select>
                    </div>
                </div>
            </div>

            {/* --- Client Details --- */}
            <div className="form-section">
                <h3>Client Details</h3>
                 <div className="form-grid">
                    <div><label htmlFor="clientName">Name:</label><input type="text" id="clientName" name="name" value={clientDetails.name} onChange={handleClientChange} /></div>
                    <div><label htmlFor="clientAddress">Address:</label><textarea id="clientAddress" name="address" value={clientDetails.address} onChange={handleClientChange} rows="3"></textarea></div>
                    <div><label htmlFor="clientEmail">Email:</label><input type="email" id="clientEmail" name="email" value={clientDetails.email} onChange={handleClientChange} /></div>
                    <div><label htmlFor="clientPhone">Phone:</label><input type="tel" id="clientPhone" name="phone" value={clientDetails.phone} onChange={handleClientChange} /></div>
                </div>
            </div>

            {/* --- Item Input --- */}
             <div className="form-section">
                <h3>Add / Edit Item</h3>
                <BillDetails onSaveItem={handleSaveItem} itemToEdit={itemToEdit} editingIndex={editingIndex} key={`edit-form-${editingIndex}`}/>
            </div>

            {/* --- Item List (Editable) --- */}
            <ItemList
                items={items}
                currencySymbol={currencySymbol}
                onDeleteItem={handleDeleteItem}
                onEditItem={handleEditItem}
            />

            {/* --- Printable Invoice Area START --- */}
            <div ref={invoiceRef} className="invoice-preview-area" style={{ margin: '20px 0', padding: '30px', border: '1px solid #eee', backgroundColor: '#fff' }}>
                {/* --- Optional Header within Printable Area --- */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#333' }}>{companyDetails.name}</h2>
                        <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>{companyDetails.address}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>{companyDetails.email}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>{companyDetails.phone}</p>
                    </div>
                     <div style={{ textAlign: 'right' }}>
                         <h2 style={{ margin: 0, color: '#333' }}>INVOICE</h2>
                         <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}># {invoiceMeta.invoiceNumber}</p>
                         <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>Status: {invoiceMeta.status}</p>
                         <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>Date: {invoiceMeta.invoiceDate}</p>
                         <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>Due: {invoiceMeta.dueDate}</p>
                    </div>
                </div>
                 <div style={{ marginBottom: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                     <h3 style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: '#555' }}>Bill To:</h3>
                     <p style={{ margin: '2px 0', fontSize: '0.9em', fontWeight: 'bold' }}>{clientDetails.name}</p>
                     <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>{clientDetails.address}</p>
                     <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>{clientDetails.email}</p>
                     <p style={{ margin: '2px 0', fontSize: '0.8em', color: '#555' }}>{clientDetails.phone}</p>
                 </div>

                {/* Re-using ItemList for display. Pass currency. */}
                <ItemList
                    items={items}
                    currencySymbol={currencySymbol}
                    // Pass dummy/no-op functions for print view if needed
                    onDeleteItem={() => {}}
                    onEditItem={() => {}}
                />
                 {/* Re-using TotalAmount for display. Pass currency. */}
                <TotalAmount
                    totals={totals}
                    discount={discount}
                    taxRate={taxRate}
                    currencySymbol={currencySymbol}
                />
                 {/* Add terms/notes here if needed */}
            </div>
            {/* --- Printable Invoice Area END --- */}

            {/* --- Tax/Discount Inputs (Moved down - doesn't need printing) --- */}
            <div className="form-section">
                 <h3>Totals & Adjustments</h3>
                 <div className="form-grid">
                     <div><label htmlFor="taxRate">Tax Rate (%):</label><input type="number" id="taxRate" name="taxRate" value={taxRate} onChange={handleTaxChange} min="0" step="0.01" /></div>
                     <div>
                        <label>Discount:</label>
                        <input type="number" id="discountValue" name="discountValue" value={discount.value} onChange={handleDiscountChange} min="0" step="0.01" />
                        <div className="discount-options">
                            <label><input type="radio" name="discountType" value="percentage" checked={discount.type === 'percentage'} onChange={handleDiscountChange}/> %</label>
                            <label><input type="radio" name="discountType" value="fixed" checked={discount.type === 'fixed'} onChange={handleDiscountChange}/> Fixed ({currencySymbol})</label>
                        </div>
                     </div>
                </div>
            </div>

            {/* --- Action Buttons --- */}
            <div className="invoice-controls">
                <button className="save-btn" onClick={handleSaveInvoice}>Save Invoice</button>
                <button className="pdf-btn" onClick={handleDownloadPDF}>Download PDF</button>
                {/*<button className="print-btn" onClick={handlePrint}>Print Invoice</button>*/}
            </div>
        </div>
    );
}

export default App;