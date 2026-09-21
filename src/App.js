import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AccountType from "./pages/AccountType";
import SignupCustomer from "./pages/SignupCustomer";
import SignupMediator from "./pages/SignupMediator";
import CreateStore from "./pages/CreateStore";
import Login from "./pages/Login";
import MediatorDashboard from "./pages/MediatorDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import MediatorProfile from "./pages/MediatorProfile";
import MediatorOrders from "./pages/MediatorOrders";
import MediatorReviews from "./pages/MediatorReviews";
import MyOrders from "./pages/MyOrders";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MediatorServices from "./pages/MediatorServices";
import NewOrder from "./pages/NewOrder";
import OrderDetails from "./pages/OrderDetails";
<<<<<<< HEAD
import ProtectedRoute from "./components/ProtectedRoute";
=======
import MediatorNotifications from "./pages/MediatorNotifications";
import CustomerProfile from "./pages/CustomerProfile";
>>>>>>> 643435e9fd251ad699a4d2de105f1be6ac3fe048

function App() {
  return (
    <Routes>
<<<<<<< HEAD
  <Route path="/" element={<Home />} />
  <Route path="/account-type" element={<AccountType />} />
  <Route path="/signup-customer" element={<SignupCustomer />} />
  <Route path="/signup-mediator" element={<SignupMediator />} />
  <Route path="/login" element={<Login />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />

  {/* ===== صفحات الوسيطة (broker) ===== */}
  <Route
    path="/create-store"
    element={
      <ProtectedRoute allowedRole="broker">
        <CreateStore />
      </ProtectedRoute>
    }
  />
  <Route
    path="/mediator-dashboard"
    element={
      <ProtectedRoute allowedRole="broker">
        <MediatorDashboard />
      </ProtectedRoute>
    }
  />
  <Route
    path="/mediator-profile"
    element={
      <ProtectedRoute allowedRole="broker">
        <MediatorProfile />
      </ProtectedRoute>
    }
  />
  <Route
    path="/mediator-orders"
    element={
      <ProtectedRoute allowedRole="broker">
        <MediatorOrders />
      </ProtectedRoute>
    }
  />
  <Route
    path="/mediator-orders/:id"
    element={
      <ProtectedRoute allowedRole="broker">
        <OrderDetails />
      </ProtectedRoute>
    }
  />
  <Route
    path="/mediator-reviews"
    element={
      <ProtectedRoute allowedRole="broker">
        <MediatorReviews />
      </ProtectedRoute>
    }
  />
  <Route
    path="/mediator-services"
    element={
      <ProtectedRoute allowedRole="broker">
        <MediatorServices />
      </ProtectedRoute>
    }
  />

  {/* ===== صفحات الزبونة (customer) ===== */}
  <Route
    path="/customer-dashboard"
    element={
      <ProtectedRoute allowedRole="customer">
        <CustomerDashboard />
      </ProtectedRoute>
    }
  />
  <Route
    path="/my-orders"
    element={
      <ProtectedRoute allowedRole="customer">
        <MyOrders />
      </ProtectedRoute>
    }
  />
  <Route
    path="/new-order"
    element={
      <ProtectedRoute allowedRole="customer">
        <NewOrder />
      </ProtectedRoute>
    }
  />
</Routes>
=======
      <Route path="/" element={<Home />} />
      <Route path="/account-type" element={<AccountType />} />
      <Route path="/signup-customer" element={<SignupCustomer />} />
      <Route path="/signup-mediator" element={<SignupMediator />} />
      <Route path="/create-store" element={<CreateStore />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mediator-dashboard" element={<MediatorDashboard />} />
      <Route path="/customer-dashboard" element={<CustomerDashboard />} />
      <Route path="/mediator-profile" element={<MediatorProfile />} />
      <Route path="/mediator-orders" element={<MediatorOrders />} />
      <Route path="/mediator-reviews" element={<MediatorReviews />} />
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mediator-services" element={<MediatorServices />} />
      <Route path="/new-order" element={<NewOrder />} />
      <Route path="/mediator-orders/:id" element={<OrderDetails />} />
      <Route path="/mediator-notifications" element={<MediatorNotifications />} />
      <Route path="/profile" element={<CustomerProfile />} />
    </Routes>
>>>>>>> 643435e9fd251ad699a4d2de105f1be6ac3fe048
  );
}

export default App;
