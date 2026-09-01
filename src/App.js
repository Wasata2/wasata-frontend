import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AccountType from "./pages/AccountType";
import SignupCustomer from "./pages/SignupCustomer";
import SignupMediator from "./pages/SignupMediator";
import CreateStore from "./pages/CreateStore";
import Login from "./pages/Login";
import MediatorDashboard from './pages/MediatorDashboard';
import CustomerDashboard from "./pages/CustomerDashboard";
import MediatorProfile from './pages/MediatorProfile';
import MediatorOrders from "./pages/MediatorOrders";
import MediatorReviews from "./pages/MediatorReviews";

function App() {
  return (
    <Routes>
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
    </Routes>
  );
}

export default App;