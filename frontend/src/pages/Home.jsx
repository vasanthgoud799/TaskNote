// pages/Home.jsx
import TaskList from "../components/TaskList";
import NoteList from "../components/NoteList";

function Home() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">TaskNote</h1>
      <TaskList />
      <NoteList />
    </div>
  );
}

export default Home;