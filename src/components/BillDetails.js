import React, { useState, useEffect } from 'react';

const BillDetails = ({ onSaveItem, itemToEdit, editingIndex }) => {
    // --- State for form inputs ---
    const [item, setItem] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const isEditing = editingIndex !== null;

    // --- Effect to pre-fill form when editing ---
    useEffect(() => {
        if (isEditing && itemToEdit) {
            setItem(itemToEdit.item);
            setQuantity(itemToEdit.quantity);
            setPrice(itemToEdit.price);
            setErrorMessage(''); // Clear error when starting edit
        } else {
            // Reset form if not editing or itemToEdit is cleared
            resetForm();
        }
        // Dependency array includes itemToEdit to react to changes
    }, [itemToEdit, isEditing]);

    // --- Reset form fields ---
    const resetForm = () => {
        setItem('');
        setQuantity(1);
        setPrice(0);
        setErrorMessage('');
        // Note: We don't reset editingIndex here, that's handled in App.js
    };


    // --- Handle form submission (Add or Update) ---
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission if wrapped in <form>

        // Basic Validation
        if (!item.trim()) {
            setErrorMessage('Please enter an item name.');
            return;
        }
         // Consider relaxing this validation based on previous feedback
        // if (!/^[a-zA-Z\s]+$/.test(item)) { // Allow letters and spaces
        //    setErrorMessage('Item name should only contain letters and spaces.');
        //    return;
        // }

        const currentItemData = {
            item: item.trim(),
            quantity: quantity, // Will be parsed in App.js handleSaveItem
            price: price      // Will be parsed in App.js handleSaveItem
        };

        onSaveItem(currentItemData); // Pass data up to App.js

        // Only reset form if NOT in editing mode (App.js will reset editing state)
         if (!isEditing) {
             resetForm();
         }
         // If editing, App.js handles resetting the edit state after save,
         // which will trigger the useEffect here to clear the form if needed.
    };

    // --- Render ---
    return (
        // Using a div, but could be a <form> with onSubmit={handleSubmit}
        <div>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            <div className="form-grid">
                <div>
                    <label htmlFor="itemName">Item:</label>
                    <input
                        id="itemName"
                        type="text"
                        value={item}
                        onChange={(e) => setItem(e.target.value)}
                        placeholder="Item name"
                        required
                    />
                </div>
                <div>
                     <label htmlFor="itemQuantity">Quantity:</label>
                    <input
                        id="itemQuantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1" // Basic validation
                        required
                    />
                </div>
                <div>
                     <label htmlFor="itemPrice">Price ($):</label>
                    <input
                        id="itemPrice"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0" // Basic validation
                        step="0.01"
                        required
                    />
                </div>
                 <div style={{ alignSelf: 'flex-end' }}> {/* Align button */}
                    <button type="button" onClick={handleSubmit}>
                        {isEditing ? 'Update Item' : 'Add Item'}
                    </button>
                </div>
            </div>


        </div>
    );
};

export default BillDetails;