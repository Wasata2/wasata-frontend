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
import MediatorNotifications from "./pages/MediatorNotifications";
import CustomerProfile from "./pages/CustomerProfile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
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
      <Route
        path="/mediator-notifications"
        element={
          <ProtectedRoute allowedRole="broker">
            <MediatorNotifications />
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
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRole="customer">
            <CustomerProfile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;