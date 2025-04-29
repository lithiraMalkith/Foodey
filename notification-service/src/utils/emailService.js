const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail', // Can be changed to any other service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // Enable debug output
  logger: true // Log information about the mail transport
});

// Log email configuration (without showing the full password)
console.log(`Email configuration: ${process.env.EMAIL_USER}, Password: ${process.env.EMAIL_PASS ? '******' : 'not set'}`);

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP server connection error:', error);
  } else {
    console.log('SMTP server connection successful, ready to send emails');
  }
});

/**
 * Send order confirmation email to customer
 * @param {string} email - Customer email address
 * @param {string} orderId - Order ID
 * @param {object} orderDetails - Order details (items, total, etc.)
 */
exports.sendOrderConfirmationEmail = async (email, orderId, orderDetails = {}) => {
  try {
    const mailOptions = {
      from: `"Foodey" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmed - Foodey Order #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4CAF50;">Your Order is Confirmed!</h1>
          </div>
          <div>
            <p>Dear Customer,</p>
            <p>Thank you for your order. We're pleased to confirm that your order #<strong>${orderId}</strong> has been received and is being processed.</p>
            ${orderDetails.items ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
              <h3 style="margin-top: 0;">Order Summary:</h3>
              <ul style="padding-left: 20px;">
                ${orderDetails.items.map(item => `<li>${item.quantity}x ${item.name} - $${item.price.toFixed(2)}</li>`).join('')}
              </ul>
              <p style="font-weight: bold; margin-top: 15px;">Total: $${orderDetails.total ? orderDetails.total.toFixed(2) : '0.00'}</p>
            </div>` : ''}
            <p>We'll notify you when your order is out for delivery.</p>
            <p>Thank you for choosing Foodey!</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #777;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order delivery notification email to customer
 * @param {string} email - Customer email address
 * @param {string} orderId - Order ID
 * @param {object} deliveryDetails - Delivery details (ETA, delivery person, etc.)
 */
exports.sendOrderDeliveryEmail = async (email, orderId, deliveryDetails = {}) => {
  try {
    // Check if this is a delivery completion notification
    const isDeliveryComplete = deliveryDetails.isCompleted === true;
    
    const mailOptions = {
      from: `"Foodey" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isDeliveryComplete 
        ? `Your Foodey Order #${orderId} has been delivered!` 
        : `Your Foodey Order #${orderId} is on the way!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: ${isDeliveryComplete ? '#4CAF50' : '#2196F3'};">
              ${isDeliveryComplete ? 'Your Order Has Been Delivered!' : 'Your Order is on the Way!'}
            </h1>
          </div>
          <div>
            <p>Dear Customer,</p>
            <p>
              ${isDeliveryComplete 
                ? `We're happy to inform you that your order has been successfully delivered.` 
                : `Great news! Your order #<strong>${orderId}</strong> is now out for delivery.`}
            </p>
            ${deliveryDetails.deliveryPerson ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
              <h3 style="margin-top: 0;">${isDeliveryComplete ? 'Delivery Information:' : 'Delivery Details:'}</h3>
              <p><strong>Order ID :</strong> ${orderId}</p>
              ${!isDeliveryComplete && deliveryDetails.eta ? `<p><strong>Estimated Time of Arrival:</strong> ${deliveryDetails.eta}</p>` : ''}
              ${deliveryDetails.phoneNumber ? `<p><strong>Contact:</strong> ${deliveryDetails.phoneNumber}</p>` : ''}
              ${isDeliveryComplete && deliveryDetails.completedAt ? `<p><strong>Delivered at:</strong> ${new Date(deliveryDetails.completedAt).toLocaleString()}</p>` : ''}
              ${deliveryDetails.deliveryAddress ? `<p><strong>Delivery Address:</strong> ${deliveryDetails.deliveryAddress}</p>` : ''}
            </div>` : ''}
            <p>${isDeliveryComplete ? 'We hope you enjoyed your meal!' : 'Enjoy your meal!'}</p>
            <p>Thank you for choosing Foodey!</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #777;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Order delivery email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order delivery email:', error);
    return { success: false, error: error.message };
  }
};
