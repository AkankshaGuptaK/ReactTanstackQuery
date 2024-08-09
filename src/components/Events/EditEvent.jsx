import {
  Link,
  redirect,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit,
} from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import { queryClient, updateEvent } from "../../util/http.js";

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const params = useParams();
  const submit = useSubmit();
  const id = params.id;

  const {
    data: eventData,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["events", id],
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
    staleTime: 10000,
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["events", id] });
      const previousEvent = queryClient.getQueryData(["events", id]);
      queryClient.setQueryData(["events", id], data.event);

      return {
        previousEvent,
      };
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(["events", id], context.previousEvent);
    },
    onSettled: () => {
      queryClient.invalidateQueries(["events", id]);
    },
  });

  function handleSubmit(formData) {
    submit(formData, { method: "PUT" });
    // mutate({ id, event: formData });
    // navigate("../");
  }

  function handleClose() {
    navigate("../");
  }

  return (
    <Modal onClose={handleClose}>
      {state == "submitting" && (
        <div className="center">
          <LoadingIndicator />
        </div>
      )}
      {state !== "submitting" && eventData && (
        <EventForm inputData={eventData} onSubmit={handleSubmit}>
          <Link to="../" className="button-text">
            Cancel
          </Link>
          <button type="submit" className="button">
            Update
          </button>
        </EventForm>
      )}
      {isError && (
        <>
          <ErrorBlock
            title="Failed to load event"
            message={
              error.info?.message ||
              "Failed to load event, please try gain late"
            }
          />
          <div className="form-actions">
            <Link to="../" className="button" />
            Back
          </div>
        </>
      )}
    </Modal>
  );
}

export function loader({ params }) {
  return queryClient.fetchQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ id: params.id, signal }),
  });
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const updatedEventData = Object.fromEntries(formData);
  await updateEvent({ id: params.id, event: updatedEventData });
  queryClient.invalidateQueries(["events"]);
  return redirect("../");
}
