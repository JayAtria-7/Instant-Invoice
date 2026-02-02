import React from 'react';

// Added currencySymbol prop
const ItemList = ({ items, onDeleteItem, onEditItem, currencySymbol }) => {
    if (!items || items.length === 0) { // Added check for undefined items
        return <p>No items added yet.</p>;
    }

    return (
        <div className="item-list">
            <h2>Item List</h2>
            {items.map((item, index) => (
                <div className="item" key={index}> {/* Prefer unique IDs */}
                    <div>{item.item}</div>
                    <div>Qty: {item.quantity}</div>
                    {/* Used currencySymbol */}
                    <div>Price: {currencySymbol}{Number(item.price || 0).toFixed(2)}</div>
                    {/* Used currencySymbol */}
                    <div>Total: {currencySymbol}{(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</div>
                    {/* Conditionally render buttons only if handlers are provided */}
                    {onEditItem && onDeleteItem && (
                         <div>
                            <button className="edit-btn" onClick={() => onEditItem(index)}>Edit</button>
                            <button className="delete-btn" onClick={() => onDeleteItem(index)}>Delete</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ItemList;