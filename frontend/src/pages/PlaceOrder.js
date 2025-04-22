import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PlaceOrder = () => {
  const [items, setItems] = useState([{ name: 'Pizza', price: 10.99, quantity: 1 }]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_ORDER_API_URL}/api/orders`,
        {
          restaurantId: 'mock_restaurant_1',
          items,
          total,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Order placement failed');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h2 className="text-2xl font-bold mb-4">Place Order</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Item</label>
          <input
            type="text"
            value={items[0].name}
            onChange={(e) =>
              setItems([{ ...items[0], name: e.target.value }])
            }
            className="w-full p-2 border rounded"
            disabled
          />
        </div>
        <div>
          <label className="block">Quantity</label>
          <input
            type="number"
            value={items[0].quantity}
            onChange={(e) =>
              setItems([{ ...items[0], quantity: parseInt(e.target.value) || 1 }])
            }
            className="w-full p-2 border rounded"
            min="1"
          />
        </div>
        <div>
          <label className="block">Total: ${total.toFixed(2)}</label>
        </div>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Place Order
        </button>
      </form>
    </div>
  );
};

export default PlaceOrder;