import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import PlaceOrder from './pages/PlaceOrder';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import TrackDelivery from './pages/TrackDelivery';
import RestaurantAdmin from './pages/RestaurantAdmin';
import RestaurantOrders from './pages/RestaurantOrders';
import DeliveryPersonnel from './pages/DeliveryPersonnel';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import DriverProfile from './pages/DriverProfile';
import OrderAssignment from './pages/OrderAssignment';
import DeliveryTracking from './pages/DeliveryTracking';
import PaymentPage from './pages/PaymentPage';

// Import delivery styles
import './styles/delivery.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/place-order" element={<PlaceOrder />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/track/:orderId" element={<TrackDelivery />} />
          <Route path="/restaurant-admin" element={<RestaurantAdmin />} />
          <Route path="/restaurant-orders" element={<RestaurantOrders />} />
          <Route path="/delivery-personnel" element={<DeliveryPersonnel />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* New Delivery Management Routes */}
          <Route path="/driver-profile" element={<DriverProfile />} />
          <Route path="/order-assignment" element={<OrderAssignment />} />
          <Route path="/track-delivery/:orderId" element={<DeliveryTracking />} />
          
          {/* Payment Route */}
          <Route path="/payment/:orderId" element={<PaymentPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;