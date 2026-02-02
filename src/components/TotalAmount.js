import React from 'react';

// Added currencySymbol prop
const TotalAmount = ({ totals, discount, taxRate, currencySymbol }) => {
    // Added default values to prevent errors if totals is undefined initially
    const { subtotal = 0, discountAmount = 0, taxAmount = 0, grandTotal = 0 } = totals || {};

    return (
        <div className="total">
            <div>
                Subtotal: <span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
                 <div>
                    Discount ({discount?.type === 'percentage' ? `${discount.value}%` : `Fixed ${currencySymbol}${discount.value}`}):
                    <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                 </div>
            )}
             {taxAmount > 0 && (
                <div>
                    Tax ({taxRate}%): <span>+{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
             )}
            <h3>
                Total Amount: <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
            </h3>
        </div>
    );
};

export default TotalAmount;