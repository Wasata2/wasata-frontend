import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AccountType from "./pages/AccountType";
import SignupCustomer from "./pages/SignupCustomer";
import SignupMediator from "./pages/SignupMediator";
import CreateStore from "./pages/CreateStore";
import Login from "./pages/Login";
import MediatorDashboard from './pages/MediatorDashboard';

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
    </Routes>
  );
}

export default App;
