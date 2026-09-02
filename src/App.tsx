import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ExamSelect from "./pages/ExamSelect";
import SubjectSelect from "./pages/SubjectSelect";
import Subject from "./pages/Subject";
import ModuleBuilder from "./pages/ModuleBuilder";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import Progress from "./pages/Progress";
import AIPrompt from "./pages/AIPrompt";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pyqs" element={<ExamSelect />} />
        <Route path="/pyqs/:exam" element={<SubjectSelect />} />
        <Route path="/pyqs/:exam/:subjectId" element={<Subject />} />
        <Route path="/module/:exam" element={<ModuleBuilder />} />
        <Route path="/quiz/:exam/:subjectId" element={<Quiz />} />
        <Route path="/quiz/:exam/custom" element={<Quiz />} />
        <Route path="/solve/:questionId" element={<Quiz />} />
        <Route path="/ai/:questionId" element={<AIPrompt />} />
        <Route path="/result/:exam" element={<Result />} />
        <Route path="/progress" element={<Progress />} />
      </Routes>
    </Layout>
  );
}