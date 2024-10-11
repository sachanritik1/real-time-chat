import { BrowserRouter, Route, Routes } from "react-router-dom";
import SignIn from "./pages/SignIn";
import ChatBox from "./pages/ChatBox";
import { RecoilRoot } from "recoil";

function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <Routes>
          <Route path="/" Component={SignIn} />
          <Route path="/home" Component={ChatBox} />
        </Routes>
      </BrowserRouter>
    </RecoilRoot>
  );
}

export default App;
