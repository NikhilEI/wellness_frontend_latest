export interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
  imageSrc: string;
}

export const PANKAJ_JAIN_CONTACT: Contact = {
  name: "Pankaj Jain",
  role: "Chief Growth Officer",
  phone: "+91 9810172077",
  email: "pankajj@eigroup.in",
  imageSrc: "/images/pankaj-jain.jpg.jpeg"
};

export const PRINCE_SINGH_CONTACT: Contact = {
  name: "Prince Singh",
  role: "Group Manager",
  phone: "+91 8826798171",
  email: "princes@eigroup.in",
  imageSrc: "/images/prince-singh-profile-pic.jpg"
};

export default function AdditionalInfoContacts({ contacts }: { contacts: Contact[] }) {
  const colClass = contacts.length > 1 ? "col-md-6" : "col-md-12";

  return (
    <>
      <div className="row">
        <div className="col-md-12">
          <div className="exhibitor-heading-left">For additional information, please contact:</div>
        </div>
      </div>
      <div className="row">
        {contacts.map((c) => (
          <div className={colClass} key={c.email}>
            <div className="profile-pic-exhibitor-main">
              <div className="pramit-kumar-profile-pic">
                <img src={c.imageSrc} alt={c.name} />
              </div>
            </div>
            <div className="profile-pic-exhibitor-details">
              <div className="exhibitor-profile-name-heading">
                {c.name} <br />
                <span>{c.role}</span>
              </div>
              <div className="exhibitor-profile-position">
                <ul>
                  <li>
                    <i className="fab fa-whatsapp profile-icon" /> {c.phone}
                  </li>
                  <li>
                    <i className="fal fa-envelope profile-icon" /> <a href={`mailto:${c.email}`}>{c.email}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
