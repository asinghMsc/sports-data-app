import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/login-form';
import { SignupForm} from './components/signup-form';
import { SourcesManager } from "./components/SourcesManager";
import './App.css'

function App() {
  return (
    
    <Routes>
      <Route path="/login" element={
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8"> 
          <LoginForm />
        </div>
      } />
      <Route path="/signup" element={
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8"> 
          <SignupForm />
        </div>
      } />
      {/* Route for the sources manager page */}
      <Route path="/sources" element={
        <div className="min-h-screen bg-gray-100 p-8"> 
          <SourcesManager />
        </div>
      } />
      {/* Redirect from root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App;