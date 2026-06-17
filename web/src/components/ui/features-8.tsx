import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, ScrollText, Database } from "lucide-react";

export function Features() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:max-w-5xl">
        <div className="relative">
          <div className="relative z-10 grid grid-cols-6 gap-3">
            {/* Top-1% lift stat */}
            <Card className="relative col-span-full flex overflow-hidden text-gold lg:col-span-2">
              <CardContent className="relative m-auto size-fit pt-6">
                <div className="relative flex h-24 w-56 items-center">
                  <svg
                    className="absolute inset-0 size-full text-muted"
                    viewBox="0 0 254 104"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M112.891 97.7022C140.366 97.0802 171.004 94.6715 201.087 87.5116C210.43 85.2881 219.615 82.6412 228.284 78.2473C232.198 76.3179 235.905 73.9942 239.348 71.3124C241.85 69.2557 243.954 66.7571 245.555 63.9408C249.34 57.3235 248.281 50.5341 242.498 45.6109C239.033 42.7237 235.228 40.2703 231.169 38.3054C219.443 32.7209 207.141 28.4382 194.482 25.534C184.013 23.1927 173.358 21.7755 162.64 21.2989C161.376 21.3512 160.113 21.181 158.908 20.796C158.034 20.399 156.857 19.1682 156.962 18.4535C157.115 17.8927 157.381 17.3689 157.743 16.9139C158.104 16.4588 158.555 16.0821 159.067 15.8066C160.14 15.4683 161.274 15.3733 162.389 15.5286C179.805 15.3566 196.626 18.8373 212.998 24.462C220.978 27.2494 228.798 30.4747 236.423 34.1232C240.476 36.1159 244.202 38.7131 247.474 41.8258C254.342 48.2578 255.745 56.9397 251.841 65.4892C249.793 69.8582 246.736 73.6777 242.921 76.6327C236.224 82.0192 228.522 85.4602 220.502 88.2924C205.017 93.7847 188.964 96.9081 172.738 99.2109C153.442 101.949 133.993 103.478 114.506 103.79C91.1468 104.161 67.9334 102.97 45.1169 97.5831C36.0094 95.5616 27.2626 92.1655 19.1771 87.5116C13.839 84.5746 9.1557 80.5802 5.41318 75.7725C-0.54238 67.7259 -1.13794 59.1763 3.25594 50.2827C5.82447 45.3918 9.29572 41.0315 13.4863 37.4319C24.2989 27.5721 37.0438 20.9681 50.5431 15.7272C68.1451 8.8849 86.4883 5.1395 105.175 2.83669C129.045 0.0992292 153.151 0.134761 177.013 2.94256C197.672 5.23215 218.04 9.01724 237.588 16.3889C240.089 17.3418 242.498 18.5197 244.933 19.6446C246.627 20.4387 247.725 21.6695 246.997 23.615C246.455 25.1105 244.814 25.5605 242.63 24.5811C230.322 18.9961 217.233 16.1904 204.117 13.4376C188.761 10.3438 173.2 8.36665 157.558 7.52174C129.914 5.70776 102.154 8.06792 75.2124 14.5228C60.6177 17.8788 46.5758 23.2977 33.5102 30.6161C26.6595 34.3329 20.4123 39.0673 14.9818 44.658C12.9433 46.8071 11.1336 49.1622 9.58207 51.6855C4.87056 59.5336 5.61172 67.2494 11.9246 73.7608C15.2064 77.0494 18.8775 79.925 22.8564 82.3236C31.6176 87.7101 41.3848 90.5291 51.3902 92.5804C70.6068 96.5773 90.0219 97.7419 112.891 97.7022Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="mx-auto block w-fit text-5xl font-semibold text-gold">
                    +49%
                  </span>
                </div>
                <h2 className="mt-6 text-center text-3xl font-semibold text-washi">
                  More fraud, top 1%
                </h2>
              </CardContent>
            </Card>

            {/* Peer-relative scoring gauge */}
            <Card className="relative col-span-full overflow-hidden text-crimson sm:col-span-3 lg:col-span-2">
              <CardContent className="pt-6">
                <div className="relative mx-auto flex aspect-square size-32 rounded-full border border-border before:absolute before:-inset-2 before:rounded-full before:border before:border-border/60">
                  <svg
                    className="m-auto h-fit w-24"
                    viewBox="0 0 212 143"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      className="text-ash"
                      d="M44.0209 55.3542C43.1945 54.7639 42.6916 54.0272 42.5121 53.1442C42.3327 52.2611 42.5995 51.345 43.3125 50.3958C50.632 40.3611 59.812 32.5694 70.8525 27.0208C81.8931 21.4722 93.668 18.6979 106.177 18.6979C118.691 18.6979 130.497 21.3849 141.594 26.7587C152.691 32.1326 161.958 39.8936 169.396 50.0417C170.222 51.1042 170.489 52.0486 170.196 52.875C169.904 53.7014 169.401 54.4097 168.688 55C167.979 55.5903 167.153 55.8571 166.208 55.8004C165.264 55.7437 164.438 55.2408 163.729 54.2917C157.236 45.0833 148.885 38.0307 138.675 33.1337C128.466 28.2368 117.633 25.786 106.177 25.7812C94.7257 25.7812 83.9827 28.2321 73.948 33.1337C63.9132 38.0354 55.5903 45.0881 48.9792 54.2917C48.2709 55.3542 47.4445 55.9444 46.5 56.0625C45.5556 56.1806 44.7292 55.9444 44.0209 55.3542ZM126.188 142.656C113.91 139.587 103.875 133.476 96.0834 124.325C88.2917 115.173 84.3959 103.988 84.3959 90.7708C84.3959 84.8681 86.5209 79.9097 90.7709 75.8958C95.0209 71.8819 100.156 69.875 106.177 69.875C112.198 69.875 117.333 71.8819 121.583 75.8958C125.833 79.9097 127.958 84.8681 127.958 90.7708C127.958 94.6667 129.434 97.9439 132.385 100.602C135.337 103.261 138.819 104.588 142.833 104.583C146.847 104.583 150.271 103.256 153.104 100.602C155.938 97.9486 157.354 94.6714 157.354 90.7708C157.354 77.0764 152.337 65.566 142.302 56.2396C132.267 46.9132 120.285 42.25 106.354 42.25C92.4237 42.25 80.441 46.9132 70.4063 56.2396C60.3716 65.566 55.3542 77.0174 55.3542 90.5937C55.3542 93.4271 55.621 96.9687 56.1546 101.219C56.6882 105.469 57.9562 110.427 59.9584 116.094C60.3125 117.156 60.2842 118.101 59.8734 118.927C59.4625 119.753 58.7825 120.344 57.8334 120.698C56.8889 121.052 55.9752 121.024 55.0921 120.613C54.2091 120.202 53.5881 119.522 53.2292 118.573C51.4584 113.969 50.1905 109.395 49.4255 104.853C48.6605 100.31 48.2756 95.6158 48.2709 90.7708C48.2709 75.0694 53.9682 61.9062 65.363 51.2812C76.7577 40.6562 90.3624 35.3437 106.177 35.3437C122.115 35.3437 135.809 40.6562 147.26 51.2812C158.712 61.9062 164.438 75.0694 164.438 90.7708C164.438 96.6736 162.343 101.601 158.155 105.554C153.966 109.506 148.859 111.485 142.833 111.49C136.813 111.49 131.649 109.513 127.342 105.561C123.035 101.608 120.88 96.6783 120.875 90.7708C120.875 86.875 119.43 83.5978 116.54 80.9392C113.65 78.2805 110.196 76.9536 106.177 76.9583C102.163 76.9583 98.7089 78.2876 95.8142 80.9462C92.9195 83.6049 91.4745 86.8797 91.4792 90.7708C91.4792 102.222 94.8745 111.785 101.665 119.458C108.456 127.132 117.22 132.503 127.958 135.573C129.021 135.927 129.729 136.517 130.083 137.344C130.438 138.17 130.497 139.056 130.26 140C130.024 140.826 129.552 141.535 128.844 142.125C128.135 142.715 127.25 142.892 126.188 142.656Z"
                      fill="currentColor"
                    />
                    <path
                      d="M3 72H209"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="relative z-10 mt-6 space-y-2 text-center">
                  <h2 className="text-lg font-medium text-washi">
                    Peer-relative scoring
                  </h2>
                  <p className="text-ash">
                    Every provider is judged only against their true specialty
                    peers, never the whole population.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ROC stat card */}
            <Card className="relative col-span-full overflow-hidden text-gold sm:col-span-3 lg:col-span-2">
              <CardContent className="flex h-full flex-col items-center justify-center pt-6">
                <Database className="mb-4 size-7 text-crimson" strokeWidth={1.3} />
                <span className="font-heading text-5xl font-bold text-gold">0.81</span>
                <div className="relative z-10 mt-6 space-y-2 text-center">
                  <h2 className="text-lg font-medium text-washi">
                    ROC-AUC on real data
                  </h2>
                  <p className="text-ash">
                    Matches the published Florida Atlantic benchmark on CMS
                    Medicare Part B + the OIG LEIE.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Explainable flags */}
            <Card className="relative col-span-full overflow-hidden lg:col-span-3">
              <CardContent className="grid pt-6 sm:grid-cols-2">
                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                  <div className="relative flex aspect-square size-12 rounded-full border border-border before:absolute before:-inset-2 before:rounded-full before:border before:border-border/60">
                    <ScrollText className="m-auto size-5 text-gold" strokeWidth={1} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium text-washi">
                      Every flag is explained
                    </h2>
                    <p className="text-ash">
                      No black box. Each ranked provider arrives with a plain
                      reason an investigator can act on.
                    </p>
                  </div>
                </div>
                <div className="rounded-tl-md relative -mb-6 -mr-6 mt-6 h-fit border-l border-t border-border p-6 py-6 sm:ml-6">
                  <div className="absolute left-3 top-2 flex gap-1">
                    <span className="block size-2 rounded-full border border-border bg-crimson/30" />
                    <span className="block size-2 rounded-full border border-border bg-gold/30" />
                    <span className="block size-2 rounded-full border border-border bg-washi/20" />
                  </div>
                  <ul className="mt-3 space-y-3 font-mono text-xs text-ash">
                    <li>
                      <span className="text-crimson">!</span> bills 3.2σ above peers
                      / patient
                    </li>
                    <li>
                      <span className="text-crimson">!</span> 11 services never seen
                      in specialty
                    </li>
                    <li>
                      <span className="text-crimson">!</span> 98th pct unique HCPCS
                      codes
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* PU learning */}
            <Card className="relative col-span-full overflow-hidden lg:col-span-3">
              <CardContent className="grid h-full pt-6 sm:grid-cols-2">
                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                  <div className="relative flex aspect-square size-12 rounded-full border border-border before:absolute before:-inset-2 before:rounded-full before:border before:border-border/60">
                    <Users className="m-auto size-6 text-gold" strokeWidth={1} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium text-washi">
                      Learns from incomplete labels
                    </h2>
                    <p className="text-ash">
                      PU learning treats the uncaught as unknown, not innocent,
                      and finds more hidden fraud.
                    </p>
                  </div>
                </div>
                <div className="relative mt-6 flex flex-col justify-center gap-4 sm:-my-6 sm:-mr-6">
                  <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-4 py-3">
                    <span className="text-xs text-ash">standard</span>
                    <span className="font-heading text-xl text-ash/70">14%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-gold/40 bg-crimson/10 px-4 py-3">
                    <span className="text-xs text-gold">PU learning</span>
                    <span className="font-heading text-xl text-crimson-bright text-glow">
                      21%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
