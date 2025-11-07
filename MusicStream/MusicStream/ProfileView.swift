import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        VStack(spacing: 16) {
                            Circle()
                                .fill(Color.white.opacity(0.1))
                                .frame(width: 80, height: 80)
                                .overlay(
                                    Image(systemName: "person.fill")
                                        .font(.largeTitle)
                                        .foregroundColor(.white.opacity(0.6))
                                )
                            
                            Text("Guest User")
                                .font(.title2)
                                .fontWeight(.medium)
                                .foregroundColor(.white)
                            
                            Text("Free Plan")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.6))
                        }
                        .padding(.top, 40)
                        
                        VStack(spacing: 12) {
                            Button(action: {}) {
                                HStack {
                                    Text("Upgrade to HiFi")
                                        .font(.system(size: 16, weight: .medium))
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                }
                                .foregroundColor(.black)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(8)
                            }
                            
                            MenuButton(icon: "gear", title: "Settings")
                            MenuButton(icon: "bell", title: "Notifications")
                            MenuButton(icon: "lock", title: "Privacy")
                            MenuButton(icon: "questionmark.circle", title: "Help & Support")
                        }
                        .padding(.horizontal)
                        
                        Button(action: {
                            authViewModel.signOut()
                        }) {
                            Text("Sign Out")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.red.opacity(0.8))
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white.opacity(0.05))
                                .cornerRadius(8)
                        }
                        .padding(.horizontal)
                        .padding(.top, 20)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}

struct MenuButton: View {
    let icon: String
    let title: String
    
    var body: some View {
        Button(action: {}) {
            HStack {
                Image(systemName: icon)
                    .frame(width: 24)
                Text(title)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
            }
            .foregroundColor(.white)
            .padding()
            .background(Color.white.opacity(0.05))
            .cornerRadius(8)
        }
    }
}
