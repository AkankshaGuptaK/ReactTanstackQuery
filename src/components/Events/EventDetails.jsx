import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import Header from "../Header.jsx";
import { deleteEvent, fetchEvent, queryClient } from "../../util/http.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import { useState } from "react";
import Modal from "../UI/Modal.jsx";

export default function EventDetails() {
  const [isDeleting, setIsDeleting] = useState(false);
  const params = useParams();
  const id = params.id;
  const navigate = useNavigate();

  const {
    data: eventData,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["events", id],
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
  });

  const {
    mutate,
    isPending: isDeletePending,
    isError: isDeleteError,
    error: deleteError,
  } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events"],
        refetchType: "none",
      });
      navigate("/events");
    },
  });

  function deleteClickHandler() {
    mutate({id});
  }

  function handleStartDelete() {
    setIsDeleting(true);
  }

  function handleCancleDelete() {
    setIsDeleting(false);
  }

  // let formattedDate;
  // if (eventData && eventData.date) {
  //   formattedDate = new Date(eventData.date).toLocaleDateString("en-US", {
  //     day: "numeric",
  //     month: "short",
  //     year: "numberic",
  //   });
  // }

  return (
    <>
      {isDeleting && (
        <Modal onClose={handleCancleDelete}>
          <h2>Are you sure?</h2>
          <p>
            Do you really want to delete this event? This action cannot be
            undone.
          </p>
          <div className="form-actions">
            {isDeletePending && <p>Deleting, please wait...</p>}
            {!isDeletePending && (
              <>
                <button className="button-text" onClick={handleCancleDelete}>
                  Cancel
                </button>
                <button className="button" onClick={deleteClickHandler}>
                  Delete
                </button>
              </>
            )}
          </div>
          {isDeleteError && (
            <ErrorBlock
              title="Failed to delete event"
              message={
                deleteError.info?.message ||
                "Failed to delete event, please try again later."
              }
            />
          )}
        </Modal>
      )}
      <Outlet />
      <Header>
        <Link to="/events" className="nav-item">
          View all Events
        </Link>
      </Header>
      {isPending && (
        <div id="event-details-content" className="center">
          Event details loading...
        </div>
      )}
      {isError && (
        <ErrorBlock
          title="An error occured!"
          message={error.info?.message || "Please try again later."}
        />
      )}
      {!isPending && eventData && (
        <article id="event-details">
          <header>
            <h1>{eventData.title}</h1>
            <nav>
              <button onClick={handleStartDelete}>Delete</button>
              <Link to="edit">Edit</Link>
            </nav>
          </header>
          <div id="event-details-content">
            <img
              src={`http://localhost:3000/${eventData.image}`}
              alt={eventData.title}
            />
            <div id="event-details-info">
              <div>
                <p id="event-details-location">{eventData.location}</p>
                <time dateTime={`Todo-DateT$Todo-Time`}>
                  {eventData.date} @ {eventData.time}
                </time>
              </div>
              <p id="event-details-description">{eventData.description}</p>
            </div>
          </div>
        </article>
      )}
    </>
  );
}
