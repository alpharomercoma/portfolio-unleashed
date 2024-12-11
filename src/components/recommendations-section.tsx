import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

const recommendations = [
    {
        name: 'Abraham Magpantay',
        position: 'Former Adviser',
        company: 'FEU Tech ACM',
        image: '/recommendations/sir_abe.jpg',
        text: "Beyond his technical skills, Alpha was a collaborative and proactive member of the ACM Student Chapter, an academic organization for computer science, always contributing insightful ideas and fostering a positive environment. He also demonstrated strong communication and leadership skills, making him a standout among his peers.",
        receivedOn: "December 2024",
    },
    {
        name: 'Guennevere Rito',
        position: 'Former Vice President Externals',
        company: 'FEU Tech ACM',
        image: '/recommendations/guenn.jpg',
        text: "I can confidently say that he is an exceptional Webmaster with a forward-thinking mindset. Alpha never limited himself to his job responsibilities. Instead, he consistently ventured beyond his role, introducing ideas that greatly benefited the entire computer science community at FEU Tech.",
        receivedOn: "August 2024",

    },
    {
        name: 'Rab Karl Colasino',
        position: 'Webmaster',
        company: 'FEU Tech ACM',
        image: '/recommendations/rab.jpg',
        text: "As Webmaster at FEU Tech ACM, He demonstrated exceptional leadership and technical skills. Also, his commitment to the ACM Beyond Campus Initiative positively impacted over a lot of people. Alpha's full-stack and back-end expertise, combined with a passion for education, make him an outstanding developer and team player.",
        receivedOn: "July 2024",
    },
    {
        name: 'Justine Jude Pura, MBA',
        position: 'CS Faculty',
        company: 'FEU Tech',
        image: '/recommendations/sir_pura.jpg',
        text: "What distinguishes Alpha further is his remarkable humility and positive attitude. Despite his impressive credentials and achievements, he remains grounded and approachable, always willing to learn and grow. His blend of intellectual curiosity, leadership qualities, and character make him a standout individual.",
        receivedOn: "March 2024",
    },
    {
        name: 'Jeneffer Sabonsolin',
        position: 'CS Faculty',
        company: 'FEU Tech',
        image: '/recommendations/sir_sabonsolin.jpg',
        text: "Alpha Romer Coma, my student in design thinking, exhibits a profound passion for academic excellence, evident in the outstanding quality of his work. I eagerly anticipate witnessing his continued growth and achievements.",
        receivedOn: "March 2024",
    },
    {
        name: 'Xynil Jhed Lacap',
        position: 'Team Lead',
        company: 'FEU Tech ACMX',
        image: '/recommendations/lacap.jpg',
        text: "Alpha is an amazing team player, who always steps up his game especially in developing a program. He is really adept at adapting in unfavorable situations, and his skills to turn the tide in our team's favor is incredible.",
        receivedOn: "March 2024",
    },
    {
        name: 'Beau Gray Habal',
        position: 'CS Faculty',
        company: 'FEU Tech',
        image: '/recommendations/maam_habal.jpg',
        text: "Alpha consistently performs well academically. His work reflects a deep understanding of the material, and he consistently produces quality assignment. Alpha is exceptionally curious and displays a genuine eagerness to learn. He works well with his fellow classmates and is evident that he is a team player.",
        receivedOn: "January 2024",
    },
    {
        name: 'Michelle Anne Constantino',
        position: 'CS Faculty',
        company: 'FEU Tech',
        image: '/recommendations/maam_constantino.jpg',
        text: "I was Alpha's Computer Systems Architecture professor, but I didn't see him just as a student of CSA, he has always given an effort towards class work and goes beyond what is being asked. I had always admired how you go beyond what classes are always.",
        receivedOn: "December 2023",
    },
    {
        name: 'Angelo Arguson, DIT',
        position: 'CS Faculty',
        company: 'FEU Tech',
        image: '/recommendations/profile.png',
        text: "Mr. Alpha Romer is my data structure student. He is industrious and knowledgeable in computer programming. He is a multilingual person and a very competitive when it comes to project submissions. He can be a candidate for intern software development in the future of this school.",
        receivedOn: "July 2023",
    }, {
        name: 'John Kenneth Andales',
        position: 'Software Engineer',
        company: 'Samsung',
        image: '/recommendations/sir_andales.jpg',
        text: "Mr. Coma is a development-oriented person, as his passion for the field is unparalleled. His enthusiasm for sharing ideas and collaborating with colleagues fosters a dynamic and engaging work environment.",
        receivedOn: "March 2023",
    },
    {
        name: 'John Rey Basilio',
        position: 'Costumer Service Representative',
        company: 'Teleperformance',
        image: '/recommendations/basilio.jpg',
        text: "Mr. Coma is an excellent teammate you can rely on. We both honed our skills through simultaneous exchange of ideas or solutions whether it may be design-related or code-related. Learning with Mr. Coma is such a pleasure.",
        receivedOn: "February 2023",
    },
    {
        name: 'Kritoffer Ian Sioson',
        position: 'CS Undergraduate',
        company: 'FEU Tech',
        image: '/recommendations/ian.jpg',
        text: "I had a terrific experience working with him, he gave me a detailed explanation of the project that we are working on and brought me a new perspective on things that I usually can't figure. Working with Mr. Alpha Romer Coma is something I heartily endorse.",
        receivedOn: "December 2022",
    },
    // {
    //     name: 'Job Isaac Ong',
    //     position: 'CS Undergraduate',
    //     company: 'FEU Tech',
    //     image: '/recommendations/ong.jpg',
    //     text: "Working with Mr. Alpha Romer Coma on the project was a pleasure, since he has been very responsive and professional throughout. I hope to work with him again in the future. The project was delivered on time, and the quality of the work is excellent. I highly recommend working with Mr. Alpha Romer Coma"
    //     receivedOn: "December 2022",
    // },
];

export default function Recommendations() {
    return (
        <section className="py-12" id="recommendations">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-10 text-center">Recommendations</h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {recommendations.map((rec, index) => (
                        <Card key={index} className="bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center mb-4">
                                    <Image
                                        src={rec.image}
                                        alt={rec.name}
                                        width={48}
                                        height={48}
                                        className="rounded-full mr-4"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{rec.name}</h3>
                                        <p className="text-sm text-gray-600">{rec.position} at {rec.company}</p>
                                    </div>
                                </div>
                                <p className="text-muted-foreground z-10 relative">{rec.text}</p>
                                <br />
                                <hr />
                                <p className="text-sm text-gray-600 mt-4 text-right">Received on {rec.receivedOn}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
