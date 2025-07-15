import { useEffect } from "react";
import { useFormState } from "react-dom";
import z from "zod";

export const commentSchema = z.object({
  author: z.string().nonempty({ message: "Required" }).min(2, { message: "2 min" }).max(20, { message: "20 max" }),
  message: z.string().nonempty({ message: "Required" }).min(10, { message: "10 min" }).max(50, { message: "50 max" }),
});

export interface IFormAction<TValues, TResponse = undefined> {
  isSubmitted: boolean;
  isSuccess: boolean;
  submitCount: number;
  values: TValues;
  errors: {
    fieldErrors: {
      [K in keyof TValues]?: { message: string };
    };
    formErrors: string[];
  };
  response?: TResponse;
}

interface AddCommentAction extends IFormAction<Comment, Comment[]> {
  actionised: boolean;
}

export type FormActionType<T> = (previousState: T, payload: FormData) => Promise<T>;

const test: FormActionType<AddCommentAction> = async (prev, payload) => {
  return new Promise(() => prev);
};

export default function useServerForm<TActionType, TFormData>(
  action: FormActionType<TActionType>,
  initialState: TFormData,
  resolverSchema: any
) {
  const [state, formAction, isPending] = useFormState(action, {
    isSubmitted: false,
    isSuccess: false,
    submitCount: 0,
    values: {
      ...initialState,
    },
    errors: { fieldErrors: {}, formErrors: [] },
  });

  const {
    errors: { fieldErrors, formErrors },
    values,
  } = formState;

  const {
    register,
    formState: { errors: rhfErrors, touchedFields },
    setError,
    reset,
  } = useForm<Comment>({
    resolver: zodResolver(resolverSchema),
    mode: "all",
    values: {
      ...values,
    },
  });

  // Sync client errors with server errors if client missed validation at time of submit
  useEffect(() => {
    Object.entries(errors || {}).map(([key, value]) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      if (!rhfErrors[key]) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        setError(key, { message: value.message });
      }
    });

    if (formErrors.length > 0) {
      setError("root", { message: formErrors[0] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors, formErrors, setError]);

  useEffect(() => {
    if (values) {
      reset(values, {
        keepDirty: true,
        keepErrors: true,
        keepTouched: true,
      });
    }
  }, [values, reset]);

  return {
    isSubmitted,
    isSuccess,
    submitCount,

    // From rhf
    errors: rhfErrors,
    register,
    touchedFields, // todo: mark all touched after submission?

    // Action
    formAction,
    isPending,
  };
}

const TestComponent = () => {
  const { errors, formAction, isPending, isSubmitted, isSuccess, register, submitCount, touchedFields } = useServerForm(
    test,
    {}
  );

  return (
    <div>
      <h1>Hello world</h1>
    </div>
  );
};
