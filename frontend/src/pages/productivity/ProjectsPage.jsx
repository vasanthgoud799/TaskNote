import React from "react";
import { FiArchive, FiFolder } from "react-icons/fi";
import EmptyState from "../../components/common/EmptyState.jsx";
import Loader from "../../components/common/Loader.jsx";
import AppShell from "../../components/layout/AppShell.jsx";
import Header from "../../components/layout/Header.jsx";
import InlineCreateForm from "../../components/productivity/InlineCreateForm.jsx";
import { useResource } from "../../hooks/useResource.js";

const ProjectsPage = () => {
  const { items: projects, loading, error, load, create, remove } = useResource("/api/projects", "projects");

  return (
    <AppShell>
      {({ openMenu }) => (
        <>
          <Header title="Projects" subtitle="Group tasks and notes by outcome." onMenu={openMenu} />
          <InlineCreateForm
            placeholder="Create a project..."
            submitLabel="Add project"
            fields={[{ name: "description", placeholder: "Description" }]}
            onSubmit={(form) => create({ name: form.title, description: form.description }, "project")}
          />
          {loading ? (
            <Loader label="Loading projects" />
          ) : error ? (
            <EmptyState title="Could not load projects" description={error} actionLabel="Retry" onAction={load} />
          ) : projects.length ? (
            <section className="notes-grid">
              {projects.map((project) => (
                <article className="note-card" key={project.id}>
                  <div className="note-card-top">
                    <span className="category-badge"><FiFolder /> {project.color}</span>
                    <strong>{project.progress}%</strong>
                  </div>
                  <h3>{project.name}</h3>
                  <p>{project.description || "No description yet."}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${project.progress}%` }} />
                  </div>
                  <button className="btn btn-ghost" type="button" onClick={() => remove(project.id)}>
                    <FiArchive /> Archive
                  </button>
                </article>
              ))}
            </section>
          ) : (
            <EmptyState title="No projects yet" description="Create a project to organize your next outcome." />
          )}
        </>
      )}
    </AppShell>
  );
};

export default ProjectsPage;
