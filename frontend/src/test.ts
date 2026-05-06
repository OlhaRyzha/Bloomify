// // app/notes/[id]/page.tsx

// import {
//   QueryClient,
//   HydrationBoundary,
//   dehydrate,
// } from "@tanstack/react-query";
// import { getSingleNote } from "@/lib/api";
// import NoteDetailsClient from "./NoteDetails.client";

// type Props = {
//   params: Promise<{ id: string }>;
// };

// const NoteDetails = async ({ params }: Props) => {
//   const { id } = await params;
//   const queryClient = new QueryClient();

//   await queryClient.prefetchQuery({
//     queryKey: ["note", id],
//     queryFn: () => getSingleNote(id),
//   });

//   return (
//     <HydrationBoundary state={dehydrate(queryClient)}>
//       <NoteDetailsClient />
//     </HydrationBoundary>
//   );
// };

// export default NoteDetails;

// HydrationBoundary – компонент, передає кеш клієнту
// dehydrate(queryClient) – перетворює кеш у серіалізований обʼєкт

// Вивід даних у клієнтському компоненті

// Тепер в клієнтському компоненті необхідно також отримати ідентифікатор нотатки із URL через useParams, додати хук useQuery та опрацювати дані.

// // app/notes/[id]/NoteDetails.client.tsx

// "use client";

// import { useQuery } from "@tanstack/react-query";
// import { useParams } from 'next/navigation';
// import { getSingleNote } from "@/lib/api";

// const NoteDetailsClient = () => {
// 	const { id } = useParams<{ id: string }>();

//   const { data: note, isLoading, error } = useQuery({
//     queryKey: ["note", id],
//     queryFn: () => getSingleNote(id),
//     refetchOnMount: false,
//   });

//   if (isLoading) return <p>Loading...</p>;

//   if (error || !note) return <p>Some error..</p>;

//   const formattedDate = note.updatedAt
//     ? `Updated at: ${note.updatedAt}`
//     : `Created at: ${note.createdAt}`;

//   return (
//     <div>
//       <h2>{note.title}</h2>
//       <p>{note.content}</p>
//       <p>{formattedDate}</p>
//     </div>
//   );
// };

// export default NoteDetailsClient;

// useParams – хук для клієнтських компонентів, який повертає об'єкт із динамічними параметрами поточного маршруту, підставленими з URL; він не приймає жодних аргументів.
// В useQuery потрібно передати той же queryKey, що і для prefetchQuery, щоб дістати із кешу дані відповідної нотатки.
// Також обов’язково вказуємо, що нам не потрібен повторний запит при монтуванні клієнтського компонента (refetchOnMount: false). Це вимикає повторний запит при монтуванні, оскільки дані вже є з prefetchQuery.

// В результаті при переході на сторінку нотатки отримаємо її дані.
