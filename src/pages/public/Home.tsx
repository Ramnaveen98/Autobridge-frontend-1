/*import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="card p-6 md:p-10 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold">Autobridge Car Services</h1>
        <p className="mt-2 text-blue-200">Explore cars, request services, and book test drives.</p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link to="/cars" className="btn-primary">Browse Cars</Link>
          <Link to="/services" className="btn-outline">See Services</Link>
        </div>
      </section>
    </div>
  );
}*/


export default function Home() {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-bold">Welcome to Autobridge</h1>
      <p className="opacity-80">
        Browse cars, view services, and book test drives or maintenance.
      </p>
    </div>
  );
}

