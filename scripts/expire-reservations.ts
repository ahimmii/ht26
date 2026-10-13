import { expireUnpaidOrders } from "../src/server/orders";

expireUnpaidOrders()
  .then((result) => {
    console.log(`Expired ${result.expired} unpaid reservations`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
